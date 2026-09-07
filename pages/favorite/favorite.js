// pages/favorite/favorite.js —— 收藏记录 / 浏览足迹（共用页面，type 区分）
const app = getApp();
const { collectApi, footprintApi, cartApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    type: 'collect',
    isFootprint: false,
    // 收藏
    list: [],
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden',
    // 足迹
    groups: [],
    fpTotal: 0,
    loading: true
  },

  onLoad(options) {
    const type = options.type === 'footprint' ? 'footprint' : 'collect';
    this.setData({
      type,
      isFootprint: type === 'footprint'
    });
    wx.setNavigationBarTitle({ title: type === 'footprint' ? '浏览足迹' : '收藏记录' });
  },

  onShow() {
    this.load();
    app.updateCartBadge();
  },

  load() {
    this.setData({ loading: true });
    if (this.data.isFootprint) {
      footprintApi.getPage().then((res) => {
        this.setData({ groups: res.groups, fpTotal: res.total, loading: false });
      }).catch(() => this.setData({ loading: false }));
    } else {
      collectApi.getPage({ current: 1, size: 100 }).then((res) => {
        this.setData({
          list: res.records,
          total: res.total,
          loading: false,
          loadStatus: 'nomore'
        });
      }).catch(() => this.setData({ loading: false }));
    }
  },

  // 取消收藏
  cancelCollect(e) {
    const goodsId = e.currentTarget.dataset.goodsid;
    collectApi.toggle(goodsId).then(() => {
      toast.showSuccess('已取消收藏');
      this.load();
    });
  },

  clearFootprint() {
    if (!this.data.groups.length) return;
    toast.showModal('确定清空全部浏览足迹吗？', '清空足迹').then((ok) => {
      if (!ok) return;
      footprintApi.clear().then(() => {
        toast.showSuccess('已清空');
        this.load();
      });
    });
  },

  onAddCart(e) {
    const g = e.detail.goods;
    const taste = g.specs[1] && g.specs[1].values[0] ? g.specs[1].values[0].label : '原味';
    cartApi.add({ goodsId: g.id, count: 1, specText: '标准装 · ' + taste, price: g.price })
      .then(() => {
        toast.showSuccess('已加入购物车');
        app.updateCartBadge();
      });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  }
});
