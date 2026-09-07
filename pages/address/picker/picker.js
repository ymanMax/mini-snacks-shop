// pages/address/picker/picker.js —— 下单地址选择器（逐地址运费预览）
const addressApi = require('../../../api/address.js')
const cartApi = require('../../../api/cart.js')
const orderApi = require('../../../api/order.js')
const { formatPrice } = require('../../../utils/format.js')

const app = getApp()

Page({
  data: {
    list: [],
    loading: true
  },

  onLoad() {
    this.load()
  },

  load() {
    Promise.all([addressApi.getList(), this.buildItems()]).then((res) => {
      const addresses = res[0]
      const items = res[1]
      if (!items.length) {
        this.setData({ loading: false })
        return
      }
      // 逐地址试算运费
      const jobs = addresses.map((a) =>
        orderApi.preview({ items: items, addressId: a.id }).then((p) => ({
          id: a.id,
          freight: p.outRange ? -1 : p.freight,
          free: !p.outRange && p.freight === 0,
          outRange: p.outRange,
          rangeKm: p.rangeKm
        })).catch(() => ({ id: a.id, freight: null, free: false, outRange: true, rangeKm: 15 }))
      )
      Promise.all(jobs).then((pricing) => {
        const list = addresses.map((a) => {
          const p = pricing.find((x) => x.id === a.id) || {}
          return Object.assign({}, a, {
            freightText: p.outRange ? '暂不支持配送' : (p.free ? '免配送费' : '配送费 ' + formatPrice(p.freight)),
            outRange: !!p.outRange
          })
        })
        this.setData({ list: list, loading: false })
      })
    })
  },

  buildItems() {
    // 来源：确认页快照 / 购物车勾选 / 立即购买
    if (app.globalData.orderItems && app.globalData.orderItems.length) {
      return Promise.resolve(app.globalData.orderItems)
    }
    const buyNow = app.globalData.buyNow
    if (buyNow && buyNow.length) return Promise.resolve(buyNow)
    return cartApi.getCart().then((cart) => {
      return cart.valid.filter((i) => i.checked).map((i) => ({
        cartId: i.id,
        goodsId: i.goodsId,
        name: i.name,
        pic: i.pic,
        specText: i.specText,
        price: i.price,
        count: i.count
      }))
    })
  },

  select(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((a) => a.id === id)
    if (item.outRange) {
      wx.showToast({ title: '该地址暂不支持配送', icon: 'none' })
      return
    }
    wx.setStorageSync('selectedAddressId', id)
    wx.navigateBack()
  },

  add() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress?from=confirm' })
  },

  manage() {
    wx.navigateTo({ url: '/pages/address/address' })
  }
})
