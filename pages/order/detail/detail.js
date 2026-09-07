// pages/order/detail/detail.js —— 订单详情：状态头 / 配送 timeline / 骑手 / 金额 / 操作
const app = getApp();
const { orderApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    id: null,
    order: null,
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.load();
  },

  onShow() {
    if (this.data.id && !this.data.loading) this.load(true);
    app.updateCartBadge();
  },

  load(silent) {
    if (!silent) this.setData({ loading: true });
    orderApi.getDetail(this.data.id).then((order) => {
      this.setData({ order, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  pay() {
    wx.showLoading({ title: '支付中...', mask: true });
    setTimeout(() => {
      orderApi.pay(this.data.id).then(() => {
        wx.hideLoading();
        wx.showModal({
          title: '支付成功',
          content: '演示环境，不产生真实交易',
          showCancel: false,
          confirmColor: '#b4282d',
          success: () => this.load(true)
        });
      }).catch(() => wx.hideLoading());
    }, 2000);
  },

  cancel() {
    toast.showModal('确定取消这笔订单吗？', '取消订单').then((ok) => {
      if (!ok) return;
      orderApi.cancel(this.data.id).then(() => {
        toast.showSuccess('已取消');
        this.load(true);
      });
    });
  },

  receive() {
    toast.showModal('请确认已收到商品', '确认收货').then((ok) => {
      if (!ok) return;
      orderApi.receive(this.data.id).then(() => {
        toast.showSuccess('已确认收货');
        this.load(true);
      });
    });
  },

  review() {
    wx.navigateTo({ url: '/pages/order/review/review?id=' + this.data.id });
  },

  reorder() {
    orderApi.reorder(this.data.id).then(() => {
      toast.showSuccess('商品已加入购物车');
      app.updateCartBadge();
    });
  },

  // Mock 配送进度演示：2→3→4→5
  advance() {
    orderApi.advance(this.data.id).then((o) => {
      toast.showSuccess('状态已推进：' + o.statusText);
      this.load(true);
    }).catch(() => {});
  },

  callRider() {
    const phone = (this.data.order.rider && this.data.order.rider.phone) || '';
    if (phone) wx.makePhoneCall({ phoneNumber: phone.replace(/\*/g, '0'), fail: () => {} });
  },

  applyAftersale() {
    wx.navigateTo({ url: '/pages/service/refund/refund?orderId=' + this.data.id });
  },

  goAftersale() {
    const o = this.data.order;
    wx.navigateTo({ url: '/pages/service/ticket-detail/ticket-detail?id=' + o.aftersaleId });
  },

  copyNo() {
    wx.setClipboardData({
      data: String(this.data.order.orderNo),
      success: () => toast.showToast('订单号已复制')
    });
  }
});
