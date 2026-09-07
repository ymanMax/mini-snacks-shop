// pages/order/confirm.js —— 订单确认页（mode=cart 购物车结算 / mode=buynow 立即购买）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { add, mul } = require('../../utils/format.js');

Page({
  data: {
    loading: true,
    mode: 'cart',
    rawItems: [],          // 下单用的原始项 {goodsId, specText, price, count}
    items: [],             // 试算返回的展示项
    addressList: [],
    address: null,
    slots: ['尽快送达（预计45分钟）', '今天 14:00-16:00', '今天 16:00-18:00', '明天 10:00-12:00'],
    slotIndex: 0,
    payType: 1,
    coupons: [],
    couponId: 0,
    couponText: '请选择',
    remark: '',
    preview: null,
    freeGap: 0,
    outOfRange: false,   // 当前地址超出配送范围
    maxKm: 5,
    autoBest: false,     // 已自动选择最优券标记（手动改选后清除）
    showSlot: false,
    showCoupon: false,
    showPay: false,
    order: null,
    submitting: false
  },

  onLoad(options) {
    const opts = options || {};
    const mode = opts.mode === 'buynow' ? 'buynow' : 'cart';
    this.setData({ mode });
    if (mode === 'buynow') {
      this._buyNow = {
        goodsId: Number(opts.goodsId),
        specText: decodeURIComponent(opts.specText || ''),
        price: Number(opts.price) || 0,
        count: Math.max(1, Number(opts.count) || 1)
      };
    }
    this.init();
  },

  onShow() {
    // 首次进入由 init 处理；之后从地址页返回时读取选中地址
    if (!this._ready) return;
    const sid = wx.getStorageSync('selected_address_id');
    if (!sid) return;
    wx.removeStorageSync('selected_address_id');
    api.getAddressList().then(list => {
      const addr = list.find(a => a.id === Number(sid));
      this.setData({
        addressList: list,
        address: addr || list.find(a => a.isDefault) || list[0] || null
      });
      this.refreshPreview();
    }).catch(() => {});
  },

  async init() {
    this.setData({ loading: true });
    try {
      let rawItems = [];
      if (this.data.mode === 'buynow') {
        rawItems = [this._buyNow];
      } else {
        const cart = await api.getCartList();
        rawItems = (cart.valid || [])
          .filter(c => c.checked === true)
          .map(c => ({ goodsId: c.goodsId, specText: c.specText, price: c.price, count: c.count }));
      }
      if (!rawItems.length) {
        toast.showToast('请选择要结算的商品');
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
        return;
      }
      const addrList = await api.getAddressList().catch(() => []);
      this.setData({
        rawItems,
        addressList: addrList,
        address: addrList.find(a => a.isDefault) || addrList[0] || null
      });
      // 商品总额（数字计算，用于最优券与地址页配送费预估）
      this._goodsAmount = rawItems.reduce((s, it) => add(s, mul(it.price, it.count)), 0);
      // 最优券自动勾选：仅初始化时自动选择一次，用户手动改选后不再覆盖
      const best = await api.getBestCoupon(this._goodsAmount).catch(() => null);
      if (best && best.coupon) {
        this.setData({
          couponId: best.coupon.id,
          couponText: best.coupon.name,
          autoBest: true
        });
      }
      await this.refreshPreview();
      this._ready = true;
    } catch (e) {
      // 错误已自动 toast
    } finally {
      this.setData({ loading: false });
    }
  },

  // 金额试算：地址 / 优惠券变化时重新调用
  refreshPreview() {
    const { rawItems, address, couponId } = this.data;
    if (!rawItems.length) return Promise.resolve();
    return api.previewOrder({
      items: rawItems,
      addressId: address ? address.id : 0,
      couponId: couponId || 0
    }).then(p => {
      const freeGap = p.totalAmount < p.freeThreshold ? add(p.freeThreshold, -p.totalAmount) : 0;
      this.setData({
        preview: p,
        items: p.items,
        freeGap,
        outOfRange: !!p.outOfRange,
        maxKm: p.maxKm || 5
      });
      this.refreshCoupons(p.totalAmount);
    }).catch(() => {});
  },

  refreshCoupons(totalAmount) {
    api.getUsableCoupons(totalAmount).then(list => {
      const data = { coupons: list };
      // 当前选中券不再可用时清空并重算
      if (this.data.couponId && !list.some(c => c.id === this.data.couponId)) {
        data.couponId = 0;
        data.couponText = list.length ? list.length + ' 张可用' : '暂无可用';
        this.setData(data);
        this.refreshPreview();
        return;
      }
      data.couponText = this.buildCouponText(this.data.couponId, list);
      this.setData(data);
    }).catch(() => {});
  },

  buildCouponText(couponId, list) {
    if (couponId) {
      const c = list.find(x => x.id === couponId);
      if (c) return c.name;
    }
    return list.length ? list.length + ' 张可用' : '暂无可用';
  },

  // ===== 地址 =====
  goAddress() {
    const amount = this.data.preview ? this.data.preview.totalAmount : (this._goodsAmount || 0);
    wx.navigateTo({ url: '/pages/address/address?from=confirm&amount=' + amount });
  },

  // ===== 配送时段 =====
  openSlot() { this.setData({ showSlot: true }); },
  chooseSlot(e) {
    this.setData({ slotIndex: Number(e.currentTarget.dataset.i), showSlot: false });
  },

  // ===== 支付方式 =====
  setPayType(e) {
    this.setData({ payType: Number(e.currentTarget.dataset.t) });
  },

  // ===== 优惠券 =====
  openCoupon() { this.setData({ showCoupon: true }); },
  chooseCoupon(e) {
    const id = Number(e.currentTarget.dataset.id);
    const couponId = id === this.data.couponId ? 0 : id;
    this.setData({
      couponId,
      couponText: this.buildCouponText(couponId, this.data.coupons),
      autoBest: false,   // 用户手动改选后不再展示"自动选择最优券"标记
      showCoupon: false
    });
    this.refreshPreview();
  },

  closePopups() {
    this.setData({ showSlot: false, showCoupon: false });
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  // ===== 提交订单 =====
  submitOrder() {
    if (this.data.submitting) return;
    if (!this.data.address) {
      toast.showToast('请先添加收货地址');
      return;
    }
    if (this.data.outOfRange) {
      toast.showToast('该地址暂不支持配送，请更换地址');
      return;
    }
    const { rawItems, address, couponId, remark, slots, slotIndex, payType, mode } = this.data;
    this.setData({ submitting: true });
    api.createOrder({
      items: rawItems,
      addressId: address.id,
      couponId: couponId || 0,
      remark,
      deliveryDate: slotIndex === 3 ? '明天' : '今天',
      deliverySlot: slots[slotIndex],
      payType,
      fromCart: mode === 'cart'
    }).then(order => {
      getApp().refreshCartBadge();
      this.setData({ order, showPay: true });
    }).catch(() => {}).finally(() => {
      this.setData({ submitting: false });
    });
  },

  // ===== Mock 支付 =====
  confirmPay() {
    const order = this.data.order;
    if (!order || this._paying) return;
    this._paying = true;
    wx.showLoading({ title: '支付中...', mask: true });
    setTimeout(() => {
      api.payOrder(order.id).then(() => {
        wx.hideLoading();
        toast.success('支付成功');
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/order/detail?id=' + order.id });
        }, 1200);
      }).catch(() => {
        wx.hideLoading();
        this.setData({ showPay: false });
      }).finally(() => {
        this._paying = false;
      });
    }, 2000);
  },

  skipPay() {
    const order = this.data.order;
    this.setData({ showPay: false });
    if (order) {
      wx.redirectTo({ url: '/pages/order/detail?id=' + order.id });
    }
  },

  // ===== 图片兜底 =====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'items'}[${key}]._imgErr`]: true });
    }
  }
});
