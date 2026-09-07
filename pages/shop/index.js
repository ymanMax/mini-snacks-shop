// pages/shop/index.js —— 店铺主页
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    shop: null,
    logoErr: false,
    fullStars: 0,
    // 评价
    reviews: [],
    summary: null,
    current: 1,
    size: 5,
    total: 0,
    loadingMore: false,
    goReviews: false
  },

  onLoad(options) {
    if (options && options.tab === 'reviews') {
      this.setData({ goReviews: true });
    }
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  loadAll() {
    this.setData({ current: 1, reviews: [] });
    return Promise.all([
      api.getShopInfo().then(shop => {
        this.setData({ shop, fullStars: Math.round(shop.score), loading: false });
      }).catch(() => this.setData({ loading: false })),
      this.fetchReviews(1)
    ]).then(() => {
      if (this.data.goReviews) this.scrollToReviews();
    });
  },

  fetchReviews(current) {
    return api.getShopReviews({ current, size: this.data.size }).then(res => {
      this.setData({
        reviews: current === 1 ? res.records : this.data.reviews.concat(res.records),
        summary: res.summary,
        total: res.total,
        current
      });
    }).catch(() => {});
  },

  loadMore() {
    const { reviews, total, loadingMore, current } = this.data;
    if (loadingMore || (total && reviews.length >= total)) return;
    this.setData({ loadingMore: true });
    this.fetchReviews(current + 1).then(() => this.setData({ loadingMore: false }));
  },

  scrollToReviews() {
    setTimeout(() => {
      const q = wx.createSelectorQuery();
      q.select('.review-section').boundingClientRect();
      q.selectViewport().scrollOffset();
      q.exec(res => {
        const rect = res[0];
        const scroll = res[1];
        if (rect && scroll) {
          wx.pageScrollTo({ scrollTop: Math.max(0, scroll.scrollTop + rect.top - 20), duration: 300 });
        }
      });
    }, 300);
  },

  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  },

  onCopyAddress() {
    if (!this.data.shop) return;
    wx.setClipboardData({
      data: this.data.shop.address,
      success: () => toast.showToast('地址已复制')
    });
  }
});
