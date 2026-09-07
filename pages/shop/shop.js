// pages/shop/shop.js —— 店铺主页 / 店铺评价
const shopApi = require('../../api/shop.js')

Page({
  data: {
    tab: 'home',
    shop: null,
    reviews: [],
    current: 1,
    total: 0,
    loadStatus: 'hidden'
  },

  onLoad(options) {
    if (options.tab === 'review') this.setData({ tab: 'review' })
    shopApi.getInfo().then((shop) => this.setData({ shop: shop }))
    this.loadReviews(true)
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  loadReviews(reset) {
    const current = reset ? 1 : this.data.current
    this.setData({ loadStatus: 'loading' })
    shopApi.getShopReviews({ current: current, size: 10 }).then((res) => {
      const reviews = reset ? res.records : this.data.reviews.concat(res.records)
      const hasMore = current * 10 < res.total
      this.setData({
        reviews: reviews,
        current: current + 1,
        total: res.total,
        loadStatus: res.total === 0 ? 'hidden' : (hasMore ? 'hidden' : 'nomore')
      })
    })
  },

  onReachBottom() {
    if (this.data.tab !== 'review') return
    if (this.data.loadStatus === 'nomore' || this.data.loadStatus === 'loading') return
    this.loadReviews(false)
  },

  onRetry() {
    this.loadReviews(false)
  },

  previewPhoto(e) {
    const url = e.currentTarget.dataset.url
    const urls = this.data.shop.photos
    wx.previewImage({ current: url, urls: urls })
  },

  callShop() {
    wx.makePhoneCall({
      phoneNumber: this.data.shop.phone,
      fail: () => {}
    })
  },

  goCategory() {
    wx.switchTab({ url: '/pages/classic/classic' })
  },

  previewReviewImg(e) {
    // 店铺评价无晒图字段，保留兜底
  }
})
