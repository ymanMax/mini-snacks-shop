// pages/cart/cart.js —— 购物车：修复全选 bug / 失效区 / 编辑批量删 / 优惠预览 / 空态推荐
const app = getApp();
const { cartApi, orderApi, goodsApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const fmt = require('../../utils/format.js');

Page({
  data: {
    validList: [],
    invalidList: [],
    loading: true,
    allChecked: false,
    checkedCount: 0,
    totalAmount: '0.00',
    discountAmount: '0.00',
    couponDiscount: '0.00',
    couponTitle: '',
    usableCouponCount: 0,
    freightText: '',
    payAmount: '0.00',
    reduceTip: '',
    freightTip: '',
    editMode: false,
    guessList: [],
    freeThreshold: 59
  },

  onShow() {
    this.loadCart();
    app.updateCartBadge();
  },

  loadCart() {
    this.setData({ loading: true });
    cartApi.getCart().then((list) => {
      list = list || [];
      const validList = list.filter((it) => !it.invalid);
      const invalidList = list.filter((it) => it.invalid);
      this.setData({ validList, invalidList, loading: false }, () => {
        this.recalc();
      });
      // 猜你喜欢
      if (!validList.length && !this.data.guessList.length) {
        goodsApi.getPage({ current: 1, size: 8, sort: 'sales' })
          .then((res) => this.setData({ guessList: res.records }))
          .catch(() => {});
      }
    }).catch(() => this.setData({ loading: false }));
  },

  // 统一重新计算（修复原 Allprice 循环引用 index 的 bug）
  recalc() {
    const list = this.data.validList;
    const checked = list.filter((it) => it.checked);
    const checkedCount = checked.reduce((s, it) => s + it.count, 0);
    const totalAmount = checked.reduce((s, it) => fmt.add(s, fmt.mul(it.price, it.count)), 0);

    this.setData({
      allChecked: list.length > 0 && checked.length === list.length,
      checkedCount,
      totalAmount: fmt.fixed(totalAmount)
    });

    const emptyTip = {
      discountAmount: '0.00', couponDiscount: '0.00', couponTitle: '',
      usableCouponCount: 0, payAmount: '0.00', freightText: '',
      reduceTip: '', freightTip: ''
    };
    if (!checked.length) {
      this.setData(emptyTip);
      return;
    }
    // 服务端预览：满减 + 自动最优券 + 配送费（实时触发）
    orderApi.preview({
      items: checked.map((it) => ({ price: it.price, count: it.count }))
    }).then((p) => {
      const totalDiscount = fmt.add(p.fullReduceAmount, p.couponDiscount);
      const patch = Object.assign({}, emptyTip, {
        discountAmount: fmt.fixed(totalDiscount),
        couponDiscount: fmt.fixed(p.couponDiscount),
        couponTitle: p.couponTitle || '',
        usableCouponCount: p.usableCouponCount || 0,
        payAmount: fmt.fixed(p.payAmount),
        freeThreshold: p.freeFreightThreshold || p.deliveryRule.freeThreshold,
        freightText: p.unsupported
          ? '地址超配送范围'
          : (p.freight > 0 ? '另需配送费 ¥' + fmt.fixed(p.freight) : '已免配送费')
      });
      // 凑单提示：还差 xx 元享下一档满减 / 免配送费
      if (p.nextReduce && p.reduceGap > 0) {
        patch.reduceTip = `再买 ¥${fmt.fixed(p.reduceGap)}，可享满${p.nextReduce.threshold}减${p.nextReduce.reduce}`;
      }
      if (p.freightGap > 0) {
        patch.freightTip = `再买 ¥${fmt.fixed(p.freightGap)} 免配送费`;
      }
      this.setData(patch);
    }).catch(() => {});
  },

  // 单选
  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const it = this.data.validList.find((x) => x.id === id);
    cartApi.update({ id, checked: !it.checked }).then((list) => {
      this.applyList(list);
    });
  },

  // 全选
  toggleAll() {
    cartApi.toggleAll(!this.data.allChecked).then((list) => this.applyList(list));
  },

  applyList(list) {
    const validList = (list || []).filter((it) => !it.invalid);
    const invalidList = (list || []).filter((it) => it.invalid);
    this.setData({ validList, invalidList }, () => this.recalc());
    app.updateCartBadge();
  },

  // 数量
  minus(e) {
    const { id, count } = e.currentTarget.dataset;
    if (count <= 1) return;
    cartApi.update({ id, count: count - 1 }).then((list) => this.applyList(list));
  },
  plus(e) {
    const { id, count, stock } = e.currentTarget.dataset;
    if (count >= stock) {
      toast.showToast('已达库存上限');
      return;
    }
    cartApi.update({ id, count: count + 1 }).then((list) => this.applyList(list));
  },

  // 删除单个
  removeOne(e) {
    const id = e.currentTarget.dataset.id;
    toast.showModal('确定删除这件商品吗？', '删除商品').then((ok) => {
      if (!ok) return;
      cartApi.remove([id]).then((list) => {
        toast.showSuccess('已删除');
        this.applyList(list);
      });
    });
  },

  // 编辑模式
  toggleEdit() {
    this.setData({ editMode: !this.data.editMode });
  },

  // 批量删除（二次确认）
  batchDelete() {
    const ids = this.data.validList.filter((it) => it.checked).map((it) => it.id);
    if (!ids.length) {
      toast.showToast('请先选择商品');
      return;
    }
    toast.showModal(`确定删除选中的 ${ids.length} 件商品吗？`, '批量删除').then((ok) => {
      if (!ok) return;
      cartApi.remove(ids).then((list) => {
        toast.showSuccess('已删除');
        this.setData({ editMode: false });
        this.applyList(list);
      });
    });
  },

  // 失效商品
  clearInvalid() {
    if (!this.data.invalidList.length) return;
    toast.showModal('确定清空全部失效商品吗？', '清空失效商品').then((ok) => {
      if (!ok) return;
      cartApi.clearInvalid().then((list) => {
        this.applyList(list);
        toast.showSuccess('已清空');
      });
    });
  },

  // 去结算
  checkout() {
    const checked = this.data.validList.filter((it) => it.checked);
    if (!checked.length) {
      toast.showToast('请选择要结算的商品');
      return;
    }
    app.globalData.cartCheckout = checked;
    wx.navigateTo({ url: '/pages/order/confirm/confirm?from=cart' });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?product_id=' + e.currentTarget.dataset.goodsid });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  }
});
