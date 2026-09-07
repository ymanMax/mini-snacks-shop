// pages/coupon/mine/mine.js —— 我的优惠券
const couponApi = require('../../../api/coupon.js')
const toast = require('../../../utils/toast.js')

Page({
  data: {
    from: '',
    amount: 0,
    tabs: [
      { status: 1, label: '未使用' },
      { status: 2, label: '已使用' },
      { status: 3, label: '已过期' }
    ],
    active: 1,
    list: [],
    loading: true
  },

  onLoad(options) {
    this.setData({
      from: options.from || '',
      amount: Number(options.amount || 0)
    })
    wx.setNavigationBarTitle({ title: options.from === 'confirm' ? '选择优惠券' : '我的优惠券' })
  },

  onShow() {
    this.load()
  },

  switchTab(e) {
    this.setData({ active: Number(e.currentTarget.dataset.status) })
    this.load()
  },

  load() {
    this.setData({ loading: true })
    couponApi.getMine(this.data.active).then((list) => {
      const decorated = list.map((c) => {
        const usable = c.status === 1 && (!this.data.amount || c.threshold <= this.data.amount)
        return Object.assign({}, c, {
          valueText: c.type === 2 ? (c.discount / 10).toFixed(1) : c.discount,
          isDiscount: c.type === 2,
          ruleText: c.type === 3 ? '无门槛可用' : '满' + c.threshold + '元可用',
          selectable: this.data.from === 'confirm' && usable,
          disabled: this.data.from === 'confirm' && !usable
        })
      })
      this.setData({ list: decorated, loading: false })
    })
  },

  choose(e) {
    if (this.data.from !== 'confirm') {
      // 普通模式下点击未使用券 → 去逛逛
      const status = e.currentTarget.dataset.status
      if (Number(status) === 1) wx.switchTab({ url: '/pages/classic/classic' })
      return
    }
    const item = this.data.list.find((x) => x.instanceId === e.currentTarget.dataset.id)
    if (!item.selectable) {
      toast.showToast('该优惠券当前不可用')
      return
    }
    wx.setStorageSync('selectedCoupon', item)
    wx.navigateBack()
  },

  useNone() {
    wx.setStorageSync('selectedCoupon', null)
    wx.navigateBack()
  },

  goCenter() {
    wx.redirectTo({ url: '/pages/coupon/coupon' })
  }
})
