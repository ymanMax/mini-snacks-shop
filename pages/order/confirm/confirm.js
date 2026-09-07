// pages/order/confirm/confirm.js —— 订单确认：地址/时段/优惠券/备注/运费试算/mock 支付
const app = getApp();
const { orderApi, addressApi, couponApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');
const fmt = require('../../../utils/format.js');

Page({
  data: {
    from: 'cart',
    items: [],
    fromCartIds: [],
    addresses: [],
    addressId: null,
    address: null,
    slots: [
      '尽快送达（预计45分钟）',
      '今天 14:00-16:00',
      '今天 18:00-20:00',
      '明天 09:00-11:00'
    ],
    slotIndex: 0,
    showSlot: false,
    coupons: [],
    couponId: '',
    couponTitle: '',
    showCoupon: false,
    showAddress: false,
    addressOptions: [],
    addressLoading: false,
    couponChosen: false,
    remark: '',
    preview: null,
    goodsAmount: '0.00',
    unsupported: false,
    submitting: false
  },

  onLoad(options) {
    const from = options.from || 'cart';
    let items = [];
    let fromCartIds = [];
    if (from === 'buy') {
      items = app.globalData.buyNow || [];
      app.globalData.buyNow = null;
    } else {
      const checked = app.globalData.cartCheckout || [];
      app.globalData.cartCheckout = null;
      items = checked.map((it) => ({
        goodsId: it.goodsId, name: it.name, pic: it.pic,
        specText: it.specText, price: it.price, count: it.count
      }));
      fromCartIds = checked.map((it) => it.id);
    }
    this.setData({ items, fromCartIds, from });
    this.loadAddresses();
  },

  onShow() {
    // 兼容从地址管理页选择返回
    if (app.globalData.selectedAddress) {
      this.setData({ addressId: app.globalData.selectedAddress.id });
      app.globalData.selectedAddress = null;
      this.loadAddresses(true);
    }
  },

  loadAddresses(keepSelected) {
    addressApi.list().then((list) => {
      let addr;
      if (this.data.addressId) addr = list.find((a) => String(a.id) === String(this.data.addressId));
      if (!addr) addr = list.find((a) => a.isDefault) || list[0];
      this.setData({
        addresses: list,
        address: addr || null,
        addressId: addr ? addr.id : null
      }, () => this.refreshPreview());
    });
  },

  goAddress() {
    this.openAddressSheet();
  },

  // 内置地址选择器：逐地址试算配送费
  openAddressSheet() {
    const items = this.data.items;
    this.setData({ showAddress: true, addressLoading: true });
    Promise.all(this.data.addresses.map((a) =>
      orderApi.preview({
        items, addressId: a.id, couponId: this.data.couponId
      }).then((p) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        tag: a.tag,
        text: [a.province, a.city, a.district, a.detail].join(''),
        distanceKm: a.distanceKm,
        isDefault: a.isDefault,
        freight: p.freight,
        unsupported: p.unsupported,
        freightText: p.unsupported
          ? '超出配送范围'
          : (p.freight > 0 ? '配送费 ¥' + p.freight.toFixed(2) : '免配送费')
      })).catch(() => null)
    )).then((options) => {
      this.setData({
        addressOptions: options.filter(Boolean),
        addressLoading: false
      });
    });
  },
  closeAddressSheet() {
    this.setData({ showAddress: false });
  },
  noopSheet() {},
  pickAddress(e) {
    const id = Number(e.currentTarget.dataset.id);
    const opt = this.data.addressOptions.find((x) => x.id === id);
    if (!opt || opt.unsupported) {
      toast.showToast('该地址暂不支持配送');
      return;
    }
    this.setData({
      addressId: id,
      address: this.data.addresses.find((a) => a.id === id),
      showAddress: false
    }, () => this.refreshPreview());
  },

  // 配送时段
  openSlot() { this.setData({ showSlot: true }); },
  closeSheet() { this.setData({ showSlot: false, showCoupon: false, showAddress: false }); },
  noop() {},
  pickSlot(e) {
    this.setData({ slotIndex: Number(e.currentTarget.dataset.index), showSlot: false });
  },

  // 优惠券
  openCoupon() {
    const amount = this.data.preview ? this.data.preview.goodsAmount : 0;
    couponApi.getUsable(amount).then((list) => {
      this.setData({ coupons: list, showCoupon: true });
    });
  },
  pickCoupon(e) {
    const id = e.currentTarget.dataset.id;
    if (id === '') {
      this.setData({ couponChosen: true, couponId: '', couponTitle: '', showCoupon: false }, () => this.refreshPreview());
      return;
    }
    const c = this.data.coupons.find((x) => String(x.id) === String(id));
    this.setData({ couponChosen: true, couponId: id, couponTitle: c.name, showCoupon: false }, () => this.refreshPreview());
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  refreshPreview() {
    if (!this.data.items.length) return;
    const params = {
      items: this.data.items,
      addressId: this.data.addressId
    };
    // 用户未手动选券时，服务端自动选择最优券；手动选择后按用户选择
    if (this.data.couponChosen) params.couponId = this.data.couponId;
    orderApi.preview(params).then((p) => {
      const patch = {
        preview: p,
        goodsAmount: fmt.fixed(p.goodsAmount),
        unsupported: !!p.unsupported
      };
      if (!this.data.couponChosen) {
        patch.couponId = p.couponId ? String(p.couponId) : '';
        patch.couponTitle = p.couponTitle || '';
      }
      this.setData(patch);
    }).catch(() => {});
  },

  submit() {
    if (this.data.submitting) return;
    if (!this.data.address) {
      toast.showToast('请先选择收货地址');
      return;
    }
    if (this.data.unsupported) {
      toast.showToast('该地址暂不支持配送');
      return;
    }
    this.setData({ submitting: true });
    const payload = {
      items: this.data.items,
      addressId: this.data.addressId,
      couponId: this.data.couponId,
      remark: this.data.remark,
      deliverySlot: this.data.slots[this.data.slotIndex],
      payType: 1,
      fromCartIds: this.data.fromCartIds
    };
    orderApi.create(payload).then((order) => {
      // Mock 支付：2 秒 loading → 成功回调（演示环境，不产生真实交易）
      wx.showLoading({ title: '支付中...', mask: true });
      setTimeout(() => {
        orderApi.pay(order.id).then((paid) => {
          wx.hideLoading();
          app.updateCartBadge();
          wx.showModal({
            title: '支付成功',
            content: '演示环境，不产生真实交易。商家正在备货～',
            showCancel: false,
            confirmColor: '#b4282d',
            success: () => {
              wx.redirectTo({ url: '/pages/order/detail/detail?id=' + paid.id });
            }
          });
        }).catch(() => {
          wx.hideLoading();
          this.setData({ submitting: false });
          wx.redirectTo({ url: '/pages/order/detail/detail?id=' + order.id });
        });
      }, 2000);
    }).catch(() => this.setData({ submitting: false }));
  }
});
