// pages/service/tickets/tickets.js —— 售后工单列表
const { afterSaleApi } = require('../../../api/index.js');

const TABS = [
  { key: 0, label: '全部' },
  { key: 'processing', label: '处理中' },
  { key: 3, label: '已完成' },
  { key: 4, label: '已取消' }
];

Page({
  data: {
    tabs: TABS,
    active: 0,
    all: [],
    filtered: [],
    loading: true
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load();
    setTimeout(() => wx.stopPullDownRefresh(), 600);
  },

  load() {
    afterSaleApi.getPage({ current: 1, size: 50 }).then((res) => {
      this.setData({ all: res.records, loading: false }, () => this.applyFilter());
    }).catch(() => this.setData({ loading: false }));
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.key }, () => this.applyFilter());
  },

  applyFilter() {
    const key = String(this.data.active);
    let list = this.data.all;
    if (key === 'processing') list = list.filter((t) => t.status === 1 || t.status === 2);
    else if (key !== '0') list = list.filter((t) => String(t.status) === key);
    this.setData({ filtered: list });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/service/ticket-detail/ticket-detail?id=' + e.currentTarget.dataset.id });
  }
});
