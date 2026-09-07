// pages/index/index.js —— 首页
const homeApi = require('../../api/home.js')
const goodsApi = require('../../api/goods.js')
const { quickAdd } = require('../../utils/cart.js')
const { countdown, formatPrice } = require('../../utils/format.js')
const bus = require('../../utils/bus.js')

const app = getApp()
const SIZE = 10

Page({
  data: {
    loading: true,
    banners: [],
    categories: [],
    themes: [],
    seckill: null,
    goods: [],
    current: 1,
    total: 0,
    loadStatus: 'hidden', // loading | nomore | error
    cartCount: 0,
    countdownText: '',
    seckillList: []
  },

  onLoad() {
    this._busOff = bus.on(bus.EVENTS.CART_CHANGE, (p) => {
      this.setData({ cartCount: p.count })
    })
    this.init()
    this.startCountdown()
  },

  onShow() {
    this.setData({ cartCount: app.globalData.cartCount || 0 })
    app.refreshCartBadge()
  },

  onUnload() {
    if (this._busOff) this._busOff()
    if (this._timer) clearInterval(this._timer)
  },

  init() {
    this.setData({ loading: true })
    homeApi.getHome().then((home) => {
      const seckillList = home.seckill.goods.map((g) => Object.assign({}, g, {
        seckillText: formatPrice(g.seckillPrice),
        priceText: formatPrice(g.price)
      }))
      this.setData({
        banners: home.banners,
        categories: home.categories,
        themes: home.themes,
        seckill: home.seckill,
        seckillList: seckillList
      })
      this.loadGoods(true)
    }).catch(() => {
      this.setData({ loading: false, loadStatus: 'error' })
    })
  },

  // 推荐商品分页
  loadGoods(reset) {
    if (reset) {
      this.setData({ current: 1, goods: [], loadStatus: 'loading' })
    } else {
      if (this.data.loadStatus === 'loading') return
      this.setData({ loadStatus: 'loading' })
    }
    const current = reset ? 1 : this.data.current
    goodsApi.getRecent({ current: current, size: SIZE }).then((res) => {
      const goods = reset ? res.records : this.data.goods.concat(res.records)
      const hasMore = current * SIZE < res.total
      this.setData({
        loading: false,
        goods: goods,
        current: current + 1,
        total: res.total,
        loadStatus: hasMore ? 'hidden' : 'nomore'
      })
    }).catch(() => {
      this.setData({ loading: false, loadStatus: 'error' })
    })
  },

  onReachBottom() {
    if (this.data.loadStatus === 'nomore') return
    this.loadGoods(false)
  },

  onRetry() {
    this.loadGoods(false)
  },

  onPullDownRefresh() {
    this.init()
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  },

  // 秒杀倒计时
  startCountdown() {
    const tick = () => {
      if (!this.data.seckill) return
      const ms = this.data.seckill.endTime - Date.now()
      const c = countdown(ms)
      this.setData({
        countdownText: c.text,
        cdH: String(c.h).padStart(2, '0'),
        cdM: String(c.m).padStart(2, '0'),
        cdS: String(c.s).padStart(2, '0')
      })
    }
    tick()
    this._timer = setInterval(tick, 1000)
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/index/index' })
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id
    app.switchCategory(id)
  },

  goTheme(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/list/list?item=' + id })
  },

  goBanner(e) {
    const link = e.currentTarget.dataset.link
    if (!link) return
    if (link.indexOf('/pages/list') === 0) wx.navigateTo({ url: link })
    else if (link.indexOf('/pages/coupon') === 0) wx.navigateTo({ url: link })
  },

  goSeckill(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  goSeckillPage() {
    wx.navigateTo({ url: '/pages/seckill/seckill' })
  },

  onAdd(e) {
    quickAdd(e.detail.item)
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
