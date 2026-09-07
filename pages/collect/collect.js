// pages/collect/collect.js —— 收藏记录 & 浏览足迹
const collectApi = require('../../api/collect.js')
const { quickAdd } = require('../../utils/cart.js')
const toast = require('../../utils/toast.js')
const { formatPrice } = require('../../utils/format.js')

Page({
  data: {
    active: 'collect', // collect | footprint
    collects: [],
    groups: [],
    openId: null // 左滑展开的收藏项
  },

  onLoad(options) {
    this.setData({ active: options.type || 'collect' })
  },

  onShow() {
    this.load()
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.type, openId: null })
    this.load()
  },

  load() {
    if (this.data.active === 'collect') {
      collectApi.getCollectList().then((list) => this.setData({ collects: list }))
    } else {
      collectApi.getFootprint().then((groups) => {
        groups.forEach((g) => g.items.forEach((it) => { it.priceText = formatPrice(it.price) }))
        this.setData({ groups: groups })
      })
    }
  },

  // 取消收藏（心形按钮）
  toggleCollect(e) {
    const id = e.currentTarget.dataset.id
    collectApi.toggleCollect(id).then((res) => {
      toast.showToast(res.collected ? '已收藏' : '已取消收藏')
      this.load()
    })
  },

  // 左滑删除（收藏）
  touchStart(e) {
    this._startX = e.touches[0].clientX
    this._startY = e.touches[0].clientY
  },
  touchMove(e) {
    const id = e.currentTarget.dataset.id
    const dx = e.touches[0].clientX - this._startX
    const dy = e.touches[0].clientY - this._startY
    if (Math.abs(dy) > Math.abs(dx)) return
    if (dx < -20) this.setData({ openId: id })
    else if (dx > 20) this.setData({ openId: null })
  },
  touchEnd() {},
  closeSwipe() {
    this.setData({ openId: null })
  },

  clearFootprint() {
    toast.confirm('确定清空全部浏览足迹吗？').then((ok) => {
      if (!ok) return
      collectApi.clearFootprint().then(() => {
        toast.success('已清空')
        this.setData({ groups: [] })
      })
    })
  },

  onAdd(e) {
    quickAdd(e.detail.item)
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' })
  }
})
