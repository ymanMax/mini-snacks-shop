// pages/cart/cart.js
// 购物车 Tab 页（重构版）
// 数据层：统一走 api/index.js（禁止直接读 storage / require mock）
// 金额口径：一律使用接口返回的 summary（checkedAmount / allChecked / checkedCount / fullReduce）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { safeAdd, safeMul, toFixed2 } = require('../../utils/format.js');

const app = getApp();
const DEFAULT_IMG = '/static/images/default.png';

// 满减规则（仅用于兜底计算与文案展示，接口 summary.fullReduce 优先）
const FULL_REDUCE_RULES = [
  { threshold: 59, reduce: 8 },
  { threshold: 99, reduce: 20 },
  { threshold: 199, reduce: 50 }
];

// 促销提示条单行高度（rpx），用于优惠明细面板 bottom 偏移联动
const PROMO_TIP_H = 52;
// 优惠明细面板基础 bottom 偏移（rpx，与 wxss 中原 170rpx 保持一致）
const PANEL_BASE_BOTTOM = 170;

Page({
  data: {
    loading: true, // 首次加载骨架屏
    items: [], // 正常（有效）商品
    invalidItems: [], // 失效商品
    summary: {
      totalCount: 0,
      validCount: 0,
      invalidCount: 0,
      checkedCount: 0,
      checkedAmount: 0,
      allChecked: false,
      fullReduce: 0
    },
    hasAny: false, // 是否存在任意购物车项（含失效）
    editing: false, // 编辑模式（批量选择 → 删除所选）
    allSel: false, // 编辑模式下是否全部选中
    editSelectedCount: 0, // 编辑模式已选件数
    invalidExpanded: false, // 失效商品折叠区展开态
    showDiscount: false, // 优惠明细小面板
    slideId: 0, // 当前左滑展开删除的条目 id
    guessList: [], // 空态下方「猜你喜欢」
    promoTips: [], // 结算栏上方促销提示条（数据全部来自 summary.promo / summary.fullReduce）
    panelBottom: PANEL_BASE_BOTTOM, // 优惠明细面板 bottom 偏移（随提示条行数联动）
    freeShipPercent: -1 // 免配送费进度 0~100（-1 = summary.promo 缺失，不展示进度条）
  },

  onLoad() {
    // 编辑模式批量选择用的本地选中表（不进接口，避免污染结算勾选态）
    this.selMap = {};
    this.touchX = 0;
    this.touchY = 0;
  },

  /** onShow 每次都重查：从商品详情/结算页返回后数据保持同步 */
  onShow() {
    this.loadCart();
  },

  onHide() {
    this.setData({ showDiscount: false, slideId: 0 });
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /* ==================== 数据加载 ==================== */

  loadCart() {
    return api.cart
      .list()
      .then((res) => {
        this.applyCart((res && res.data) || {});
        this.setData({ loading: false });
        // 无有效商品（空车 / 仅剩失效商品）时补充「猜你喜欢」
        if (!this.data.items.length && !this.data.guessList.length) this.loadGuess();
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  loadGuess() {
    api.goods
      .guess()
      .then((res) => {
        this.setData({ guessList: (res && res.data) || [] });
      })
      .catch(() => {});
  },

  /**
   * 把接口返回的 { items, summary } 落到页面 data
   * ★ 金额与全选态一律以 summary 为准；summary 缺失时才走本地兜底计算
   */
  applyCart(data) {
    const all = (data.items || []).slice();
    const items = [];
    const invalidItems = [];
    all.forEach((it) => {
      const row = Object.assign({}, it, { _sel: this.data.editing ? !!this.selMap[it.id] : false });
      if (it.invalid) invalidItems.push(row);
      else items.push(row);
    });

    const summary = data.summary ? Object.assign({}, data.summary) : this.calcSummary(all);

    let editSelectedCount = 0;
    let allSel = false;
    if (this.data.editing) {
      editSelectedCount = items.filter((it) => it._sel).length;
      allSel = items.length > 0 && editSelectedCount === items.length;
    }

    // 促销提示条（只读 summary.promo / summary.fullReduce，接口已算好，页面不重复计算金额）
    const promoTips = this.buildPromoTips(summary);
    const panelBottom = PANEL_BASE_BOTTOM + (this.data.editing ? 0 : promoTips.length * PROMO_TIP_H);

    // 免配送费进度（展示用百分比，金额字段全部来自 summary）
    const promo = summary.promo || null;
    let freeShipPercent = -1;
    if (promo && Number(promo.freeThreshold) > 0) {
      freeShipPercent = Number(promo.freeShipDiff) > 0
        ? Math.min(99, Math.max(0, Math.round((Number(summary.checkedAmount) / Number(promo.freeThreshold)) * 100)))
        : 100;
    }

    this.setData({
      items,
      invalidItems,
      summary,
      hasAny: items.length > 0 || invalidItems.length > 0,
      editSelectedCount,
      allSel,
      slideId: 0,
      promoTips,
      panelBottom,
      freeShipPercent
    });
  },

  /**
   * 结算栏上方促销提示（V1.1 优化1）：纵向堆叠，数据全部来自接口 summary
   *  - promo.nextTier        → 「🔥 还差 ￥diff 享满 threshold 减 reduce，去凑单 >」
   *  - promo.freeShipDiff>0  → 「还差 ￥freeShipDiff 免基础配送费」
   *  - summary.fullReduce>0  → 「✓ 已享满 xx 减 fullReduce」（绿色对勾样式）
   *  - promo.usableCouponCount>0 → 「N 张优惠券可用，最优可省 ￥bestCoupon.cutAmount」
   */
  buildPromoTips(summary) {
    const tips = [];
    if (!summary) return tips;
    const promo = summary.promo || null;

    if (promo && promo.nextTier) {
      const t = promo.nextTier;
      tips.push({
        type: 'nextTier',
        text: '🔥 还差 ￥' + toFixed2(t.diff) + ' 享满 ' + t.threshold + ' 减 ' + t.reduce,
        action: '去凑单 >'
      });
    }
    if (promo && Number(promo.freeShipDiff) > 0) {
      tips.push({
        type: 'ship',
        text: '还差 ￥' + toFixed2(promo.freeShipDiff) + ' 免基础配送费'
      });
    }
    if (Number(summary.fullReduce) > 0) {
      // 「满 xx」档位仅用于文案展示（金额本身来自 summary.fullReduce）
      const rule = FULL_REDUCE_RULES.filter((r) => r.reduce === Number(summary.fullReduce))[0];
      tips.push({
        type: 'done',
        text: rule
          ? '已享满 ' + rule.threshold + ' 减 ' + Number(summary.fullReduce)
          : '已享满减 ￥' + toFixed2(summary.fullReduce)
      });
    }
    if (promo && Number(promo.usableCouponCount) > 0) {
      const best = promo.bestCoupon;
      tips.push({
        type: 'coupon',
        text: promo.usableCouponCount + ' 张优惠券可用'
          + (best ? '，最优可省 ￥' + toFixed2(best.cutAmount) : '')
      });
    }
    return tips;
  },

  /**
   * 本地兜底汇总（接口未返回 summary 时使用）
   * ★★ 修复点：旧实现在 for 循环里累加的是「当前点击项」而不是「每一项」
   *    （循环体写成 carts[index].price * carts[index].count，index 恒为点击下标），
   *    导致合计金额与全选态长期错误。
   * 正确口径：遍历 items 的每一项，且仅 !invalid && checked 的项参与金额 / 件数统计；
   * 金额用 utils/format.js 的 safeMul / safeAdd（数字运算），禁止字符串价格拼接。
   */
  calcSummary(items) {
    let totalCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    let checkedCount = 0;
    let checkedAmount = 0;
    let checkedRows = 0;

    (items || []).forEach((it) => {
      const count = Number(it.count) || 0;
      if (it.invalid) {
        invalidCount += 1;
        return;
      }
      validCount += 1;
      totalCount += count;
      if (it.checked) {
        checkedRows += 1;
        checkedCount += count;
        checkedAmount = safeAdd(checkedAmount, safeMul(it.price, count));
      }
    });

    // 满减取最优（数字比较，不做字符串运算）
    let fullReduce = 0;
    FULL_REDUCE_RULES.forEach((r) => {
      if (checkedAmount >= r.threshold && r.reduce > fullReduce) fullReduce = r.reduce;
    });

    return {
      totalCount,
      validCount,
      invalidCount,
      checkedCount,
      checkedAmount,
      allChecked: validCount > 0 && checkedRows === validCount,
      fullReduce
    };
  },

  /* ==================== 勾选 / 全选 ==================== */

  /** 单项勾选：编辑模式=本地批量选择；普通模式=同步接口结算勾选态 */
  onToggleCheck(e) {
    const id = Number(e.currentTarget.dataset.id);
    const target = this.data.items.filter((it) => it.id === id)[0];
    if (!target) return;

    if (this.data.editing) {
      this.selMap[id] = !target._sel;
      const items = this.data.items.map((it) =>
        it.id === id ? Object.assign({}, it, { _sel: !it._sel }) : it
      );
      const editSelectedCount = items.filter((it) => it._sel).length;
      this.setData({ items, editSelectedCount, allSel: items.length > 0 && editSelectedCount === items.length });
      return;
    }

    api.cart
      .update({ id, checked: !target.checked })
      .then((res) => this.applyCart((res && res.data) || {}))
      .catch(() => {});
  },

  /** 底部全选：编辑模式=批量全选；普通模式=api.cart.checkAll */
  onCheckAll() {
    if (this.data.editing) {
      const target = !this.data.allSel;
      this.selMap = {};
      const items = this.data.items.map((it) => {
        this.selMap[it.id] = target;
        return Object.assign({}, it, { _sel: target });
      });
      this.setData({ items, allSel: items.length > 0 && target, editSelectedCount: target ? items.length : 0 });
      return;
    }
    if (!this.data.items.length) {
      toast.showToast('购物车还没有商品哦');
      return;
    }
    api.cart
      .checkAll(!this.data.summary.allChecked)
      .then((res) => this.applyCart((res && res.data) || {}))
      .catch(() => {});
  },

  /* ==================== 编辑模式 ==================== */

  onToggleEdit() {
    const editing = !this.data.editing;
    this.selMap = {};
    // 进入编辑模式时沿用当前结算勾选态作为批量选择初值
    if (editing) {
      this.data.items.forEach((it) => {
        this.selMap[it.id] = !!it.checked;
      });
    }
    const items = this.data.items.map((it) =>
      Object.assign({}, it, { _sel: editing ? !!this.selMap[it.id] : false })
    );
    const editSelectedCount = items.filter((it) => it._sel).length;
    this.setData({
      editing,
      items,
      editSelectedCount,
      allSel: items.length > 0 && editSelectedCount === items.length,
      showDiscount: false,
      slideId: 0,
      // 编辑模式隐藏促销提示条 → 优惠明细面板回落基础偏移
      panelBottom: PANEL_BASE_BOTTOM + (editing ? 0 : this.data.promoTips.length * PROMO_TIP_H)
    });
  },

  onDeleteSelected() {
    const ids = this.data.items.filter((it) => it._sel).map((it) => it.id);
    if (!ids.length) {
      toast.showToast('请先选择要删除的商品');
      return;
    }
    toast
      .confirm('确定删除所选 ' + ids.length + ' 件商品吗？')
      .then((ok) => {
        if (!ok) return null;
        return api.cart.remove(ids).then((res) => {
          this.selMap = {};
          this.applyCart((res && res.data) || {});
          toast.showToast('已删除');
          app.refreshCartBadge();
        });
      })
      .catch(() => {});
  },

  /* ==================== 数量 stepper ==================== */

  onMinus(e) {
    this.changeCount(Number(e.currentTarget.dataset.id), -1);
  },

  onPlus(e) {
    this.changeCount(Number(e.currentTarget.dataset.id), 1);
  },

  /** 数量变更：min 1 / max stock，超限 toast；成功后同步接口并刷新角标 */
  changeCount(id, delta) {
    const it = this.data.items.filter((x) => x.id === id)[0];
    if (!it) return;
    const next = (Number(it.count) || 0) + delta;
    if (next < 1) {
      toast.showToast('最少购买 1 件');
      return;
    }
    const stock = Number(it.stock);
    if (!isNaN(stock) && stock > 0 && next > stock) {
      toast.showToast('库存不足，最多可购 ' + stock + ' 件');
      return;
    }
    if (next === Number(it.count)) return;

    api.cart
      .update({ id, count: next })
      .then((res) => {
        this.applyCart((res && res.data) || {});
        app.refreshCartBadge();
      })
      .catch(() => {});
  },

  /* ==================== 删除 / 失效商品 ==================== */

  /** 单条删除（左滑按钮 / 右上角 × / 长按后删除），二次确认 */
  onDeleteItem(e) {
    const id = Number(e.currentTarget.dataset.id);
    const it = this.data.items.concat(this.data.invalidItems).filter((x) => x.id === id)[0];
    const name = it ? it.name : '该商品';
    toast
      .confirm('确定删除「' + name + '」吗？')
      .then((ok) => {
        if (!ok) return null;
        return api.cart.remove([id]).then((res) => {
          delete this.selMap[id];
          this.applyCart((res && res.data) || {});
          toast.showToast('已删除');
          app.refreshCartBadge();
        });
      })
      .catch(() => {});
  },

  /** 长按条目：滑出删除按钮 */
  onLongPress(e) {
    this.setData({ slideId: Number(e.currentTarget.dataset.id) });
  },

  onTouchStart(e) {
    this.touchX = e.touches[0].clientX;
    this.touchY = e.touches[0].clientY;
  },

  /** 左滑展开删除、右滑收起（纵向滑动交给页面滚动） */
  onTouchMove(e) {
    const dx = e.touches[0].clientX - this.touchX;
    const dy = e.touches[0].clientY - this.touchY;
    if (Math.abs(dx) < Math.abs(dy)) return;
    const id = Number(e.currentTarget.dataset.id);
    if (dx < -30 && this.data.slideId !== id) this.setData({ slideId: id });
    else if (dx > 30 && this.data.slideId === id) this.setData({ slideId: 0 });
  },

  onRowTap() {
    if (this.data.slideId) this.setData({ slideId: 0 });
  },

  onToggleInvalid() {
    this.setData({ invalidExpanded: !this.data.invalidExpanded });
  },

  onClearInvalid() {
    toast
      .confirm('确定清空全部失效商品吗？')
      .then((ok) => {
        if (!ok) return null;
        return api.cart.clearInvalid().then((res) => {
          this.applyCart((res && res.data) || {});
          toast.showToast('失效商品已清空');
          app.refreshCartBadge();
        });
      })
      .catch(() => {});
  },

  /* ==================== 结算 / 优惠明细 ==================== */

  onToggleDiscount() {
    this.setData({ showDiscount: !this.data.showDiscount });
  },

  onCloseDiscount() {
    this.setData({ showDiscount: false });
  },

  /** 结算：跳订单确认页（购物车模式） */
  onSettle() {
    if (!this.data.summary.checkedCount) {
      toast.showToast('请先选择要结算的商品');
      return;
    }
    this.setData({ showDiscount: false });
    wx.navigateTo({ url: '/pages/order/confirm?fromCart=1' });
  },

  /* ==================== 跳转 / 杂项 ==================== */

  onGoDetail(e) {
    const goodsId = e.currentTarget.dataset.goodsId;
    if (!goodsId) return;
    this.setData({ slideId: 0 });
    wx.navigateTo({ url: '/pages/detail/detail?id=' + goodsId });
  },

  onGoIndex() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /** 促销提示条点击：满减档提示 → 去凑单（分类 Tab 页）；其余提示不响应 */
  onTipTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type !== 'nextTier') return;
    this.setData({ slideId: 0, showDiscount: false });
    wx.switchTab({ url: '/pages/classic/classic' });
  },

  /** 猜你喜欢里加购成功 → 重新拉购物车 */
  onGuessAdded() {
    this.loadCart();
  },

  /** 图片加载失败统一回退默认图 */
  onImgError(e) {
    const group = e.currentTarget.dataset.group;
    const index = e.currentTarget.dataset.index;
    if (group === 'invalid') {
      this.setData({ ['invalidItems[' + index + '].pic']: DEFAULT_IMG });
    } else {
      this.setData({ ['items[' + index + '].pic']: DEFAULT_IMG });
    }
  }
});
