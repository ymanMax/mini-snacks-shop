// pages/order/list.js —— 订单列表页（优化 7.1）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TABS = [
  { label: '全部', status: 0 },
  { label: '待付款', status: 1 },
  { label: '待发货', status: 2 },
  { label: '配送中', status: 3 },
  { label: '待收货', status: 4 },
  { label: '已完成', status: 5 },
  { label: '待评价', status: 7 }
];

const STATUS_MAP = {
  1: { text: '待付款', cls: 'st-orange' },
  2: { text: '待发货', cls: 'st-blue' },
  3: { text: '配送中', cls: 'st-purple' },
  4: { text: '待收货', cls: 'st-cyan' },
  5: { text: '已完成', cls: 'st-green' },
  6: { text: '已取消', cls: 'st-gray' }
};

Page({
  data: {
    tabs: TABS,
    activeStatus: 0,
    list: [],
    current: 1,
    size: 10,
    total: 0,
    noMore: false,
    firstLoading: true,
    loadingMore: false
  },

  onLoad(options) {
    const status = Number((options || {}).status) || 0;
    this._skipShow = true; // onLoad 后立即触发的首次 onShow 跳过
    this.setData({ activeStatus: status });
    this.reload();
  },

  onShow() {
    // 跳过 onLoad 后的首次 onShow；之后返回本页时刷新第一页（支付/取消/评价后状态同步）
    if (this._skipShow) {
      this._skipShow = false;
      return;
    }
    this.reload(true);
  },

  // 切换状态 Tab，重置分页
  switchTab(e) {
    const status = Number(e.currentTarget.dataset.status);
    if (status === this.data.activeStatus) return;
    this.setData({ activeStatus: status });
    this.reload();
  },

  reload(silent) {
    this.setData({ current: 1, noMore: false });
    return this.loadPage(1, silent);
  },

  loadPage(current, silent) {
    if (!silent && current === 1) this.setData({ firstLoading: true });
    if (current > 1) this.setData({ loadingMore: true });
    return api.getOrderList({ status: this.data.activeStatus, current, size: this.data.size })
      .then(res => {
        const records = (res.records || []).map(o => this.decorate(o));
        const list = current === 1 ? records : this.data.list.concat(records);
        this.setData({
          list,
          total: res.total,
          current,
          noMore: records.length < this.data.size || list.length >= res.total
        });
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ firstLoading: false, loadingMore: false });
        wx.stopPullDownRefresh();
      });
  },

  decorate(o) {
    const st = STATUS_MAP[o.status] || { text: '未知', cls: 'st-gray' };
    const count = (o.items || []).reduce((s, it) => s + it.count, 0);
    return Object.assign({}, o, {
      statusText: st.text,
      statusClass: st.cls,
      goodsCount: count,
      thumbs: (o.items || []).slice(0, 4),
      moreCount: Math.max(0, (o.items || []).length - 4)
    });
  },

  onPullDownRefresh() {
    this.reload(true);
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loadingMore || this.data.firstLoading) return;
    this.loadPage(this.data.current + 1, true);
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/order/detail?id=' + e.currentTarget.dataset.id });
  },

  noop() {},

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // ===== 操作按钮 =====
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('确认取消该订单吗？').then(ok => {
      if (!ok) return;
      api.cancelOrder(id).then(() => {
        toast.success('订单已取消');
        this.reload(true);
      }).catch(() => {});
    });
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    if (this._paying) return;
    this._paying = true;
    wx.showLoading({ title: '支付中...', mask: true });
    setTimeout(() => {
      api.payOrder(id).then(() => {
        wx.hideLoading();
        toast.success('支付成功');
        this.reload(true);
      }).catch(() => {
        wx.hideLoading();
      }).finally(() => {
        this._paying = false;
      });
    }, 2000);
  },

  remindOrder() {
    toast.showToast('已提醒商家发货');
  },

  confirmOrder(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('确认已收到商品吗？').then(ok => {
      if (!ok) return;
      api.confirmOrder(id).then(() => {
        toast.success('已确认收货');
        this.reload(true);
      }).catch(() => {});
    });
  },

  goReview(e) {
    wx.navigateTo({ url: '/pages/order/review?orderId=' + e.currentTarget.dataset.id });
  },

  goAftersaleApply(e) {
    wx.navigateTo({ url: '/pages/service/apply?orderId=' + e.currentTarget.dataset.id });
  },

  rebuy(e) {
    const id = e.currentTarget.dataset.id;
    api.rebuyOrder(id).then(() => {
      getApp().refreshCartBadge();
      toast.success('已加入购物车');
    }).catch(() => {});
  },

  // ===== 图片兜底 =====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
