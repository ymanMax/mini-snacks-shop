// components/goods-card —— 商品卡片（grid 双列 / list 横向 两种模式）
const { formatPrice, formatSales } = require('../../utils/format.js')

Component({
  externalClasses: ['custom-class'],
  properties: {
    item: {
      type: Object,
      value: {}
    },
    // grid | list
    mode: {
      type: String,
      value: 'grid'
    },
    showAdd: {
      type: Boolean,
      value: true
    },
    collected: {
      type: Boolean,
      value: false
    }
  },
  data: {},
  observers: {
    item(item) {
      if (!item) return
      const priceText = formatPrice(item.memberPrice || item.minPrice || item.price)
      const origText = item.originalPrice ? formatPrice(item.originalPrice, false) : ''
      this.setData({
        priceText: priceText,
        origText: origText,
        salesText: formatSales(item.numberSells || item.sales || 0)
      })
    }
  },
  methods: {
    onAdd() {
      this.triggerEvent('add', { item: this.data.item })
    },
    onTap() {
      this.triggerEvent('tap', { item: this.data.item })
    },
    onCollect() {
      this.triggerEvent('collect', { item: this.data.item })
    },
    goDetail() {
      const id = this.data.item.id
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
    }
  }
})
