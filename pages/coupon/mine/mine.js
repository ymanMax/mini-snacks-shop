// pages/coupon/mine/mine.js —— 我的优惠券：未使用 / 已使用 / 已过期
const { couponApi } = require('../../../api/index.js');

Page({
  data: {
    tabs: [
      { status: 1, label: '未使用' },
      { status: 2, label: '已使用' },
      { status: 3, label: '已过期' }
    ],
    active: 1,
    list: [],
    loading: true
  },

  onLoad() {
    this.load();
  },

  switchTab(e) {
    const status = Number(e.currentTarget.dataset.status);
    this.setData({ active: status });
    this.load();
  },

  load() {
    this.setData({ loading: true });
    couponApi.getMine(this.data.active).then((list) => {
      this.setData({ list, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onEmptyBtn() {
    wx.navigateTo({ url: '/pages/coupon/center/center' });
  }
});
