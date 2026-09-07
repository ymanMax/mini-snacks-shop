// pages/shop/index/index.js —— 店铺信息 + 配送规则 + 店铺评价
const { shopApi, reviewApi } = require('../../../api/index.js');

Page({
  data: {
    shop: null,
    reviews: [],
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden'
  },

  onLoad(options) {
    shopApi.getInfo().then((shop) => this.setData({ shop }));
    this.loadReviews(true);
    if (options.tab === 'review') {
      setTimeout(() => {
        wx.createSelectorQuery().select('#review-anchor').boundingClientRect((rect) => {
          if (rect) wx.pageScrollTo({ scrollTop: rect.top, duration: 200 });
        }).exec();
      }, 400);
    }
  },

  loadReviews(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading' });
    reviewApi.getShopReviews({ current: page, size: this.data.size }).then((res) => {
      const list = reset ? res.records : this.data.reviews.concat(res.records);
      this.setData({
        reviews: list,
        total: res.total,
        page: page + 1,
        loadStatus: list.length >= res.total ? 'nomore' : 'hidden'
      });
    }).catch(() => this.setData({ loadStatus: 'hidden' }));
  },

  onReachBottom() {
    if (this.data.reviews.length < this.data.total) this.loadReviews(false);
  },

  previewPhoto(e) {
    if (!this.data.shop) return;
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.shop.photos });
  },

  callShop() {
    if (this.data.shop) wx.makePhoneCall({ phoneNumber: this.data.shop.phone, fail: () => {} });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  }
});
