// pages/order/list/list.js —— 订单列表：状态 Tab + 分页 + 状态操作
const app = getApp();
const { orderApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const TABS = [
  { status: 0, label: '全部' },
  { status: 1, label: '待付款' },
  { status: 2, label: '待发货' },
  { status: 3, label: '配送中' },
  { status: 4, label: '待收货' },
  { status: 5, label: '已完成' }
];

Page({
  data: {
    tabs: TABS,
    activeStatus: 0,
    orders: [],
    loading: true,
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden'
  },

  onLoad(options) {
    const status = Number(options.status || 0);
    this.setData({ activeStatus: status });
    this.loadOrders(true);
  },

  onShow() {
    // 从详情/支付返回刷新
    if (this._needRefresh) {
      this._needRefresh = false;
      this.loadOrders(true);
    }
    app.updateCartBadge();
  },

  switchTab(e) {
    const status = Number(e.currentTarget.dataset.status);
    if (status === this.data.activeStatus) return;
    this.setData({ activeStatus: status });
    this.loadOrders(true);
  },

  loadOrders(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading', loading: reset });
    orderApi.getPage({ current: page, size: this.data.size, status: this.data.activeStatus })
      .then((res) => {
        const list = reset ? res.records : this.data.orders.concat(res.records);
        const hasMore = list.length < res.total;
        this.setData({
          orders: list,
          total: res.total,
          page: page + 1,
          loading: false,
          loadStatus: hasMore ? 'hidden' : (list.length ? 'nomore' : 'hidden')
        });
      })
      .catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  onReachBottom() {
    if (this.data.orders.length < this.data.total && this.data.loadStatus !== 'loading') {
      this.loadOrders(false);
    }
  },

  onPullDownRefresh() {
    this.loadOrders(true);
    setTimeout(() => wx.stopPullDownRefresh(), 800);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    this._needRefresh = true;
    wx.navigateTo({ url: '/pages/order/detail/detail?id=' + id });
  },

  // ---- 操作 ----
  pay(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '支付中...', mask: true });
    setTimeout(() => {
      orderApi.pay(id).then(() => {
        wx.hideLoading();
        wx.showModal({
          title: '支付成功',
          content: '演示环境，不产生真实交易',
          showCancel: false,
          confirmColor: '#b4282d',
          success: () => this.loadOrders(true)
        });
      }).catch(() => wx.hideLoading());
    }, 2000);
  },

  cancel(e) {
    const id = e.currentTarget.dataset.id;
    toast.showModal('确定取消这笔订单吗？', '取消订单').then((ok) => {
      if (!ok) return;
      orderApi.cancel(id).then(() => {
        toast.showSuccess('已取消');
        this.loadOrders(true);
      });
    });
  },

  receive(e) {
    const id = e.currentTarget.dataset.id;
    toast.showModal('请确认已收到商品', '确认收货').then((ok) => {
      if (!ok) return;
      orderApi.receive(id).then(() => {
        toast.showSuccess('已确认收货');
        this.loadOrders(true);
      });
    });
  },

  review(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order/review/review?id=' + id });
    this._needRefresh = true;
  },

  reorder(e) {
    const id = e.currentTarget.dataset.id;
    orderApi.reorder(id).then(() => {
      toast.showSuccess('已加入购物车');
      app.updateCartBadge();
    });
  },

  remind() {
    toast.showToast('已提醒商家尽快发货');
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  },

  noop() {}
});
