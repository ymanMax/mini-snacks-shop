// pages/cart/cart.js —— 购物车（优化 6：全选/总价修复、失效商品、编辑模式、优惠明细、空态推荐）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { mul, add, priceText } = require('../../utils/format.js');

const FREE_FREIGHT = 59; // 满 59 免配送费

Page({
  data: {
    loading: true,
    valid: [],
    invalid: [],
    isAll: false,
    totalPrice: 0,      // 选中总价（数字，渲染走 f.fp）
    checkedCount: 0,    // 选中件数
    editing: false,
    invalidOpen: false,
    reduceOpen: false,
    fullReduce: null,
    reduceTip: '',
    freightTip: '',
    couponTip: '',      // 最优券 / 凑单提示条（优化 1）
    recommend: []       // 空态"猜你喜欢"
  },

  onLoad() {
    api.getFullReduce().then(res => {
      this.setData({ fullReduce: res }, () => this.recompute());
    }).catch(() => {});
  },

  onShow() {
    this.loadCart(this.data.loading);
    getApp().refreshCartBadge();
  },

  onUnload() {
    if (this.bestTimer) clearTimeout(this.bestTimer);
  },

  // ===== 数据加载 =====
  loadCart(showSkeleton) {
    return api.getCartList().then(res => {
      this.setData({
        valid: res.valid || [],
        invalid: res.invalid || [],
        loading: false
      }, () => {
        this.recompute();
        this.maybeLoadRecommend();
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 操作成功后统一刷新：本地数据 + 全局角标
  afterChange() {
    this.loadCart(false);
    getApp().refreshCartBadge();
  },

  // 空态时加载"猜你喜欢"
  maybeLoadRecommend() {
    if (this.data.valid.length || this.data.invalid.length || this.data.recommend.length) return;
    api.getGoodsList({ current: 1, size: 8, sort: 'default' }).then(res => {
      this.setData({ recommend: (res.records || []).slice(0, 8) });
    }).catch(() => {});
  },

  // ===== 核心：遍历 valid 中 checked===true 的项累加 price*count（修复旧全选 bug）=====
  recompute() {
    const { valid, fullReduce } = this.data;
    let total = 0;
    let count = 0;
    let isAll = valid.length > 0;
    valid.forEach(item => {
      if (item.checked === true) {
        total = add(total, mul(item.price, item.count));
        count += item.count;
      } else {
        isAll = false;
      }
    });

    // 满减进度提示
    let reduceTip = '';
    const rules = fullReduce && fullReduce.rules
      ? fullReduce.rules.slice().sort((a, b) => a.threshold - b.threshold)
      : [];
    if (rules.length) {
      let passed = null;
      let next = null;
      rules.forEach(r => {
        if (total >= r.threshold) passed = r;
        else if (!next) next = r;
      });
      if (passed && next) {
        reduceTip = '已满 ' + passed.threshold + ' 减 ' + passed.reduce +
          '，再买 ' + priceText(add(next.threshold, -total)) + ' 可减 ' + next.reduce;
      } else if (passed) {
        reduceTip = '已满 ' + passed.threshold + ' 减 ' + passed.reduce + '，已享最高满减';
      } else if (next) {
        reduceTip = '再买 ' + priceText(add(next.threshold, -total)) + ' 可减 ' + next.reduce;
      }
    }
    const freightTip = total >= FREE_FREIGHT
      ? '已满 ' + FREE_FREIGHT + ' 元，免配送费'
      : '满 ' + FREE_FREIGHT + ' 免配送费，还差 ' + priceText(add(FREE_FREIGHT, -total)) + ' 元';

    this.setData({ totalPrice: total, checkedCount: count, isAll, reduceTip, freightTip });
    this.maybeQueryBestCoupon(total);
  },

  // ===== 最优券 / 凑单提示条（优化 1）：300ms 防抖 + 仅在总价变化时触发 =====
  maybeQueryBestCoupon(total) {
    if (total <= 0) {
      this.lastCouponAmount = 0;
      if (this.data.couponTip) this.setData({ couponTip: '' });
      return;
    }
    if (total === this.lastCouponAmount) return;
    this.lastCouponAmount = total;
    if (this.bestTimer) clearTimeout(this.bestTimer);
    this.bestTimer = setTimeout(() => {
      api.getBestCoupon(total).then(res => {
        // 响应过期（总价已再变化）则丢弃
        if (total !== this.lastCouponAmount) return;
        let couponTip = '';
        if (res && res.coupon) {
          couponTip = '🎟 结算时可用「' + res.coupon.name + '」，预计再省 ￥' + priceText(res.saving);
        } else if (total < FREE_FREIGHT) {
          couponTip = '🚚 还差 ￥' + priceText(add(FREE_FREIGHT, -total)) + ' 免配送费，去领券中心看看';
        }
        this.setData({ couponTip });
      }).catch(() => {});
    }, 300);
  },

  goCouponCenter() {
    wx.navigateTo({ url: '/pages/coupon/center' });
  },

  // ===== 勾选 =====
  onCheckItem(e) {
    const { id, index } = e.currentTarget.dataset;
    const item = this.data.valid[index];
    if (!item) return;
    const checked = !item.checked;
    api.updateCartItem({ id, checked }).then(() => {
      this.setData({ [`valid[${index}].checked`]: checked }, () => this.recompute());
    }).catch(() => {});
  },

  onCheckAll() {
    if (!this.data.valid.length) return;
    const checked = !this.data.isAll;
    api.checkAllCart(checked).then(() => {
      const valid = this.data.valid.map(x => Object.assign({}, x, { checked }));
      this.setData({ valid }, () => this.recompute());
    }).catch(() => {});
  },

  // ===== 数量 stepper =====
  onMinus(e) {
    const { id, index } = e.currentTarget.dataset;
    const item = this.data.valid[index];
    if (!item || item.count <= 1) return;
    this.changeCount(id, index, item.count - 1);
  },

  onPlus(e) {
    const { id, index } = e.currentTarget.dataset;
    const item = this.data.valid[index];
    if (!item) return;
    if (item.count >= item.stock) {
      toast.showToast('已达库存上限');
      return;
    }
    this.changeCount(id, index, item.count + 1);
  },

  changeCount(id, index, count) {
    api.updateCartItem({ id, count }).then(() => {
      this.setData({ [`valid[${index}].count`]: count }, () => {
        this.recompute();
        getApp().refreshCartBadge();
      });
    }).catch(() => {});
  },

  // ===== 删除（长按单项）=====
  onDeleteItem(e) {
    const { id } = e.currentTarget.dataset;
    toast.confirm('确定删除该商品吗？').then(ok => {
      if (!ok) return;
      api.deleteCartItems([id]).then(() => {
        toast.success('已删除');
        this.afterChange();
      }).catch(() => {});
    });
  },

  // ===== 编辑模式：批量删除 =====
  toggleEdit() {
    this.setData({ editing: !this.data.editing });
  },

  onDeleteSelected() {
    const ids = this.data.valid.filter(x => x.checked === true).map(x => x.id);
    if (!ids.length) return;
    toast.confirm('确定删除选中的 ' + ids.length + ' 件商品吗？').then(ok => {
      if (!ok) return;
      api.deleteCartItems(ids).then(() => {
        toast.success('已删除');
        this.afterChange();
      }).catch(() => {});
    });
  },

  // ===== 失效商品 =====
  toggleInvalid() {
    this.setData({ invalidOpen: !this.data.invalidOpen });
  },

  onClearInvalid() {
    toast.confirm('确定清空全部失效商品吗？').then(ok => {
      if (!ok) return;
      api.clearInvalidCart().then(() => {
        toast.success('已清空失效商品');
        this.afterChange();
      }).catch(() => {});
    });
  },

  // ===== 优惠明细展开/收起 =====
  toggleReduce() {
    this.setData({ reduceOpen: !this.data.reduceOpen });
  },

  // ===== 结算 =====
  onSettle() {
    if (!this.data.checkedCount) return;
    wx.navigateTo({ url: '/pages/order/confirm?mode=cart' });
  },

  // ===== 跳转 =====
  goShopping() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  // ===== 图片兜底（契约 §5）=====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
