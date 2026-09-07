// pages/order/slot/slot.js —— 配送时段选择
const shopApi = require('../../../api/shop.js')
const { formatDate } = require('../../../utils/format.js')

function dateLabel(offset) {
  const d = new Date(Date.now() + offset * 86400000)
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const label = offset === 0 ? '今天' : offset === 1 ? '明天' : offset === 2 ? '后天' : week
  return {
    key: formatDate(d),
    label: label + ' ' + (d.getMonth() + 1) + '月' + d.getDate() + '日',
    week: week
  }
}

Page({
  data: {
    dates: [dateLabel(0), dateLabel(1), dateLabel(2)],
    activeDate: 0,
    slots: [],
    activeSlot: 0
  },

  onLoad(options) {
    const idx = options.index ? Number(options.index) : 0
    shopApi.getInfo().then((shop) => {
      this.setData({ slots: shop.deliverySlots, activeSlot: Math.min(idx, shop.deliverySlots.length - 1) })
    })
  },

  pickDate(e) {
    this.setData({ activeDate: Number(e.currentTarget.dataset.index) })
  },

  pickSlot(e) {
    this.setData({ activeSlot: Number(e.currentTarget.dataset.index) })
  },

  confirm() {
    const d = this.data.dates[this.data.activeDate]
    const slot = this.data.slots[this.data.activeSlot]
    // 尽快送达不带预约日期
    const text = this.data.activeDate === 0 ? slot : d.label.split(' ')[0] + ' ' + slot
    wx.setStorageSync('selectedSlot', {
      dateKey: d.key,
      text: text,
      index: this.data.activeSlot
    })
    wx.navigateBack()
  }
})
