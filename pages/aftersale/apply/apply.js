// pages/aftersale/apply/apply.js —— 申请售后
const orderApi = require('../../../api/order.js')
const aftersaleApi = require('../../../api/aftersale.js')
const toast = require('../../../utils/toast.js')
const { formatPrice } = require('../../../utils/format.js')

const TYPES = [
  { type: 1, icon: '💸', name: '仅退款', desc: '未收到货或与商家协商一致' },
  { type: 2, icon: '📦', name: '退货退款', desc: '已收到货，需要寄回商品' },
  { type: 3, icon: '🔄', name: '换货', desc: '商品问题，申请更换新品' }
]
const REASONS = ['商品破损/变质', '少件/漏发', '商品与描述不符', '不想要了', '配送超时', '其他原因']

Page({
  data: {
    types: TYPES,
    reasons: REASONS,
    activeType: 1,
    reasonIndex: -1,
    desc: '',
    order: null,
    amountText: '',
    goods: [],
    submitting: false
  },

  onLoad(options) {
    this.orderId = options.orderId
    orderApi.getDetail(this.orderId).then((o) => {
      if (o.status === 1 || o.status === 6) {
        toast.showToast('该订单状态暂不支持售后')
        setTimeout(() => wx.navigateBack(), 800)
        return
      }
      this.setData({
        order: o,
        amountText: formatPrice(o.payAmount),
        goods: o.items
      })
    })
  },

  pickType(e) {
    this.setData({ activeType: Number(e.currentTarget.dataset.type) })
  },
  pickReason(e) {
    this.setData({ reasonIndex: Number(e.currentTarget.dataset.index) })
  },
  onDesc(e) {
    this.setData({ desc: e.detail.value })
  },

  submit() {
    if (this.data.reasonIndex < 0) {
      toast.showToast('请选择申请原因')
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    aftersaleApi.apply({
      orderId: this.orderId,
      type: this.data.activeType,
      reason: REASONS[this.data.reasonIndex],
      desc: this.data.desc
    }).then((t) => {
      toast.success('售后申请已提交')
      wx.redirectTo({ url: '/pages/aftersale/detail/detail?id=' + t.id })
    }).catch((err) => {
      this.setData({ submitting: false })
      toast.showToast((err && err.msg) || '提交失败')
    })
  },

  contactService() {
    wx.navigateTo({ url: '/pages/service/chat/chat?orderId=' + this.orderId })
  }
})
