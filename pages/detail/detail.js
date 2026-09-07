// pages/detail/detail.js —— 商品详情
const goodsApi = require('../../api/goods.js')
const shopApi = require('../../api/shop.js')
const cartApi = require('../../api/cart.js')
const collectApi = require('../../api/collect.js')
const couponApi = require('../../api/coupon.js')
const groupApi = require('../../api/group.js')
const homeApi = require('../../api/home.js')
const toast = require('../../utils/toast.js')
const { defaultSpecText } = require('../../utils/cart.js')
const { formatPrice, starText, formatSales } = require('../../utils/format.js')
const bus = require('../../utils/bus.js')

const app = getApp()

Page({
  data: {
    id: null,
    loading: true,
    goods: null,
    summary: null,
    reviews: [],
    reviewTotal: 0,
    reviewExpanded: false,
    recommends: [],
    coupons: [],
    myCouponIds: [],
    fullReduceRules: [],
    activeGroups: [],
    // 批发
    batchCount: 5,
    batchUnitText: '',
    batchTotalText: '',
    batchLadderLabel: '',
    groupPriceText: '',
    // 媒体
    mediaTab: 'image',
    videoError: false,
    swiperCurrent: 0,
    // SKU 弹层
    skuVisible: false,
    skuMode: 'cart', // cart | buy
    selected: {},
    skuReady: false,
    skuCount: 1,
    skuPrice: 0,
    skuStock: 0,
    skuPic: '',
    // 收藏 / 角标
    collected: false,
    cartCount: 0,
    // 格式化文本
    priceText: '',
    origText: '',
    memberText: ''
  },

  onLoad(options) {
    const id = options.id || options.product_id
    this.setData({ id: id })
    this.loadAll(id)
    collectApi.addFootprint(id).catch(() => {})
  },

  onShow() {
    this.setData({ cartCount: app.globalData.cartCount || 0 })
    app.refreshCartBadge()
  },

  onReady() {
    this._busOff = bus.on(bus.EVENTS.CART_CHANGE, (p) => this.setData({ cartCount: p.count }))
  },

  onUnload() {
    if (this._busOff) this._busOff()
  },

  loadAll(id) {
    this.setData({ loading: true })
    goodsApi.getDetail(id).then((g) => {
      const selected = {}
      g.specs.forEach((s, i) => { selected[i] = -1 })
      this.setData({
        loading: false,
        goods: g,
        selected: selected,
        skuCount: 1,
        mediaTab: 'image',
        videoError: false,
        swiperCurrent: 0,
        collected: g.isCollect,
        priceText: formatPrice(g.memberPrice ? g.price : g.price),
        origText: g.originalPrice ? formatPrice(g.originalPrice, false) : '',
        memberText: formatPrice(g.memberPrice),
        skuPrice: g.price,
        skuPriceText: formatPrice(g.price),
        skuStock: g.stock,
        skuPic: g.pic
      })
      this.calcBatch(5)
      this.setData({ groupPriceText: formatPrice(Math.round(g.price * 82) / 100) })
      wx.setNavigationBarTitle({ title: g.name })
    }).catch((err) => {
      this.setData({ loading: false })
      toast.showToast((err && err.msg) || '商品不存在')
    })

    const withStars = (list) => list.map((r) => Object.assign({}, r, { starText: starText(r.score) }))
    shopApi.getReviewSummary(id).then((s) => {
      if (s) s.preview = withStars(s.preview || [])
      this.setData({ summary: s })
    })
    shopApi.getGoodsReviews({ goodsId: id, current: 1, size: 3 }).then((res) => {
      this.setData({ reviews: withStars(res.records), reviewTotal: res.total })
    })
    goodsApi.getRecommend(id, 6).then((list) => {
      const withSales = list.map((g) => Object.assign({}, g, {
        salesText: formatSales(g.numberSells),
        priceText: formatPrice(g.memberPrice || g.price)
      }))
      this.setData({ recommends: withSales })
    })
    this.loadPromotions()
    this.loadGroups(id)
  },

  loadGroups(id) {
    groupApi.getList('active').then((list) => {
      const activeGroups = list.filter((g) => g.goodsId === id).map((g) => Object.assign({}, g, {
        groupText: formatPrice(g.groupPrice)
      }))
      this.setData({ activeGroups: activeGroups })
    }).catch(() => {})
  },

  // 发起拼团
  openGroup() {
    groupApi.open(this.data.goods.id, 3).then((res) => {
      toast.success('开团成功')
      wx.navigateTo({ url: '/pages/group/detail/detail?id=' + res.group.id })
    }).catch((err) => toast.showToast((err && err.msg) || '开团失败'))
  },

  goGroupDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/group/detail/detail?id=' + id })
  },

  // ---------- 批发阶梯 ----------
  calcBatch(count) {
    const g = this.data.goods
    if (!g) return
    const ladders = g.wholesaleLadder || []
    let hit = null
    ladders.forEach((l) => { if (count >= l.count) hit = l })
    const discount = hit ? hit.discount : 100
    const unit = Math.round(g.price * discount) / 100
    this.setData({
      batchCount: count,
      batchUnitText: formatPrice(unit),
      batchTotalText: formatPrice(unit * count),
      batchLadderLabel: hit ? hit.label : '未达批发门槛'
    })
  },

  onBatchCount(e) {
    this.calcBatch(e.detail.value)
  },

  batchAdd() {
    const g = this.data.goods
    const count = this.data.batchCount
    const ladders = g.wholesaleLadder || []
    let hit = null
    ladders.forEach((l) => { if (count >= l.count) hit = l })
    const discount = hit ? hit.discount : 100
    const unit = Math.round(g.price * discount) / 100
    const text = defaultSpecText(g) + '（批发' + count + '件）'
    cartApi.add({
      goodsId: g.id,
      count: count,
      specText: text,
      specPrice: unit,
      pic: g.pic
    }).then(() => getApp().refreshCartBadge()).then(() => {
      toast.success('已批量加入购物车 ' + count + ' 件')
    }).catch((err) => toast.showToast((err && err.msg) || '加购失败'))
  },

  // 促销信息：满减阶梯 + 可领/已领优惠券
  loadPromotions() {
    homeApi.getPromotionRules().then((r) => this.setData({ fullReduceRules: r.fullReduceRules }))
    Promise.all([couponApi.getTemplates(), couponApi.getMine(1)]).then((res) => {
      const my = res[1] || []
      const myIds = my.map((c) => c.templateId)
      const coupons = res[0].slice(0, 3).map((t) => Object.assign({}, t, {
        owned: myIds.indexOf(t.id) > -1,
        valueText: t.type === 2 ? (t.discount / 10).toFixed(1) + '折' : t.discount + '元',
        ruleText: t.type === 3 ? '无门槛' : '满' + t.threshold + '可用'
      }))
      this.setData({ coupons: coupons, myCouponIds: myIds })
    })
  },

  receiveCoupon(e) {
    const id = e.currentTarget.dataset.id
    couponApi.receive(id).then(() => {
      toast.success('领券成功')
      this.loadPromotions()
    }).catch((err) => toast.showToast((err && err.msg) || '领取失败'))
  },

  goCouponCenter() {
    wx.navigateTo({ url: '/pages/coupon/coupon' })
  },

  // ---------- 媒体区 ----------
  switchMedia(e) {
    this.setData({ mediaTab: e.currentTarget.dataset.tab })
  },
  swiperChange(e) {
    this.setData({ swiperCurrent: e.detail.current })
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.goods.pics
    })
  },
  previewReviewImg(e) {
    const urls = e.currentTarget.dataset.urls
    const url = e.currentTarget.dataset.url
    wx.previewImage({ current: url, urls: urls })
  },
  onVideoError() {
    this.setData({ videoError: true, mediaTab: 'image' })
    toast.showToast('视频加载失败，已为您切换为图文介绍')
  },

  // ---------- SKU ----------
  openSku(e) {
    const mode = e.currentTarget.dataset.mode || 'cart'
    this.setData({ skuVisible: true, skuMode: mode })
  },
  closeSku() {
    this.setData({ skuVisible: false })
  },
  noop() {},
  pickSpec(e) {
    const gi = Number(e.currentTarget.dataset.group)
    const vi = Number(e.currentTarget.dataset.index)
    const key = 'selected.' + gi
    const selected = this.data.selected
    selected[gi] = selected[gi] === vi ? -1 : vi
    this.setData({ [key]: selected[gi] })
    this.recomputeSku()
  },
  recomputeSku() {
    const g = this.data.goods
    const sel = this.data.selected
    const ready = g.specs.every((s, i) => sel[i] > -1)
    const sizeGroup = g.specs[0]
    const sizeIdx = sel[0]
    const sizeVal = sizeIdx > -1 ? sizeGroup.values[sizeIdx] : null
    const price = sizeVal ? sizeVal.price : g.price
    const stock = sizeVal ? sizeVal.stock : g.stock
    const pic = sizeVal && sizeVal.pic ? sizeVal.pic : g.pic
    const count = Math.min(this.data.skuCount, stock || 1)
    this.setData({
      skuReady: ready,
      skuPrice: price,
      skuPriceText: formatPrice(price),
      skuStock: stock,
      skuPic: pic,
      skuCount: Math.max(1, count)
    })
  },
  specText() {
    const g = this.data.goods
    const sel = this.data.selected
    return g.specs.map((s, i) => {
      const vi = sel[i]
      return vi > -1 ? s.values[vi].label : ''
    }).filter(Boolean).join(' · ')
  },
  onCountChange(e) {
    this.setData({ skuCount: e.detail.value })
  },

  confirmSku() {
    const g = this.data.goods
    if (!this.data.skuReady) {
      const firstMiss = g.specs.find((s, i) => this.data.selected[i] <= -1)
      toast.showToast('请选择' + (firstMiss ? firstMiss.name : '规格'))
      return
    }
    const specText = this.specText()
    const payload = {
      goodsId: g.id,
      count: this.data.skuCount,
      specText: specText,
      specPrice: this.data.skuPrice,
      pic: this.data.skuPic
    }
    if (this.data.skuMode === 'cart') {
      cartApi.add(payload).then(() => app.refreshCartBadge()).then(() => {
        toast.success('已加入购物车')
        this.setData({ skuVisible: false })
      }).catch((err) => toast.showToast((err && err.msg) || '加购失败'))
    } else {
      app.globalData.buyNow = [{
        goodsId: g.id,
        name: g.name,
        pic: this.data.skuPic,
        specText: specText,
        price: this.data.skuPrice,
        count: this.data.skuCount
      }]
      this.setData({ skuVisible: false })
      wx.navigateTo({ url: '/pages/order/confirm/confirm?from=buyNow' })
    }
  },

  // ---------- 收藏 ----------
  toggleCollect() {
    collectApi.toggleCollect(this.data.goods.id).then((res) => {
      this.setData({ collected: res.collected })
      toast.showToast(res.collected ? '已收藏' : '已取消收藏', 'none')
      bus.emit(bus.EVENTS.COLLECT_CHANGE, { goodsId: this.data.goods.id, collected: res.collected })
    })
  },

  // ---------- 评价 ----------
  expandReviews() {
    if (this.data.reviewExpanded) return
    shopApi.getGoodsReviews({ goodsId: this.data.id, current: 1, size: 50 }).then((res) => {
      const list = res.records.map((r) => Object.assign({}, r, { starText: starText(r.score) }))
      this.setData({ reviews: list, reviewExpanded: true })
    })
  },
  goReviewList() {
    // 本期在详情内展开全部评价
    this.expandReviews()
  },
  goAllReviews() {
    this.expandReviews()
  },

  // ---------- 推荐 / 购物车 ----------
  goDetail(e) {
    const id = e.detail ? e.detail.item.id : e.currentTarget.dataset.id
    wx.redirectTo({ url: '/pages/detail/detail?id=' + id })
  },
  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onShareAppMessage() {
    const g = this.data.goods
    // 分享得积分（每商品每天一次）
    groupApi.share('goods', g.id).then((res) => {
      if (res.rewarded) toast.showToast('分享成功，获得 5 积分')
    }).catch(() => {})
    return {
      title: g.name + ' 仅' + formatPrice(g.price) + '，零食商城限时优惠中',
      path: '/pages/detail/detail?id=' + g.id,
      imageUrl: g.pic
    }
  },

  onShareTimeline() {
    const g = this.data.goods
    return { title: g.name + ' 限时优惠', query: 'id=' + g.id, imageUrl: g.pic }
  }
})
