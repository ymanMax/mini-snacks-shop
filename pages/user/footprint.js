// pages/user/footprint.js —— 浏览足迹（优化 10）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    groups: []
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  loadList() {
    return api.getFootprints().then(groups => {
      this.setData({ groups, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onImgError(e) {
    const { g, k } = e.currentTarget.dataset;
    if (g === undefined) return;
    this.setData({ [`groups[${g}].items[${k}]._imgErr`]: true });
  },

  onTapItem(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  onClear() {
    toast.confirm('清空全部浏览记录？', '提示').then(ok => {
      if (!ok) return;
      api.clearFootprints().then(() => {
        toast.success('已清空');
        this.setData({ groups: [] });
      }).catch(() => {});
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
