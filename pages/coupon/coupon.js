// pages/coupon/coupon.js —— 领券中心
const couponApi = require('../../api/coupon.js')
const toast = require('../../utils/toast.js')

Page({
  data: {
    tabs: [
      { key: 'available', label: '可领取' },
      { key: 'received', label: '已领取' }
    ],
    active: 'available',
    list: [],
    allList: [],
    loading: true
  },

  onShow() {
    this.load()
  },

  load() {
    couponApi.getTemplates().then((list) => {
      const decorated = list.map((c) => Object.assign({}, c, {
        valueText: c.type === 2 ? (c.discount / 10).toFixed(1) : c.discount,
        unitText: c.type === 2 ? '折' : '元',
        ruleText: c.type === 3 ? '无门槛可用' : '满' + c.threshold + '元可用'
      }))
      this.setData({ allList: decorated, list: this.filter(decorated, this.data.active), loading: false })
    })
  },

  filter(list, key) {
    return key === 'received' ? list.filter((c) => c.received) : list.filter((c) => !c.received)
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ active: key, list: this.filter(this.data.allList, key) })
  },

  receive(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.allList.find((x) => x.id === id)
    if (item.received) {
      wx.navigateTo({ url: '/pages/coupon/mine/mine' })
      return
    }
    couponApi.receive(id).then(() => {
      toast.success('领券成功，已放入卡包')
      this.load()
    }).catch((err) => toast.showToast((err && err.msg) || '领取失败'))
  },

  goMine() {
    wx.navigateTo({ url: '/pages/coupon/mine/mine' })
  }
})
