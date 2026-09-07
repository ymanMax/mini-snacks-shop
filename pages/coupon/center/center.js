// pages/coupon/center/center.js —— 领券中心：可领取 / 已领取 / 已使用
const { couponApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    tabs: [
      { key: 'available', label: '可领取' },
      { key: 'received', label: '已领取' },
      { key: 'used', label: '已使用' }
    ],
    active: 'available',
    templates: [],
    mine: [],
    receivedList: [],
    usedList: [],
    loading: true
  },

  onShow() {
    this.load();
  },

  load() {
    this.setData({ loading: true });
    Promise.all([
      couponApi.getTemplates(),
      couponApi.getMine()
    ]).then(([templates, mine]) => {
      this.setData({
        templates,
        mine,
        receivedList: mine.filter((c) => c.status === 1),
        usedList: mine.filter((c) => c.status !== 1),
        loading: false
      });
    }).catch(() => this.setData({ loading: false }));
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.key });
  },

  receive(e) {
    const id = e.currentTarget.dataset.id;
    couponApi.receive(id).then(() => {
      toast.showSuccess('领取成功');
      this.load();
    }).catch(() => {});
  },

  goMine() {
    wx.navigateTo({ url: '/pages/coupon/mine/mine' });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  },

});
