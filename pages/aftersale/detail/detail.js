// pages/aftersale/detail/detail.js —— 售后工单详情/状态跟踪
const aftersaleApi = require('../../../api/aftersale.js')
const toast = require('../../../utils/toast.js')
const { starText } = require('../../../utils/format.js')

Page({
  data: {
    ticket: null,
    loading: true,
    // 评价弹层
    rateVisible: false,
    speed: 5,
    solved: 5
  },

  onLoad(options) {
    this.id = options.id
    this.load()
  },

  onShow() {
    if (this._loaded) this.load()
    this._loaded = true
  },

  load() {
    aftersaleApi.getDetail(this.id).then((raw) => {
      if (raw.rate) {
        raw.rate.speedText = starText(raw.rate.speed)
        raw.rate.solvedText = starText(raw.rate.solved)
      }
      this.setData({ ticket: raw, loading: false })
    }).catch((err) => {
      this.setData({ loading: false })
      toast.showToast((err && err.msg) || '售后单不存在')
    })
  },

  cancel() {
    toast.confirm('确定撤销该售后申请吗？', '取消售后').then((ok) => {
      if (!ok) return
      aftersaleApi.cancel(this.id).then(() => {
        toast.success('已撤销')
        this.load()
      }).catch((err) => toast.showToast((err && err.msg) || '操作失败'))
    })
  },

  // 演示：模拟商家处理
  advance() {
    aftersaleApi.advance(this.id).then(() => {
      toast.success('处理状态已更新')
      this.load()
    }).catch((err) => toast.showToast((err && err.msg) || '操作失败'))
  },

  contact() {
    wx.navigateTo({ url: '/pages/service/chat/chat' })
  },

  goOrder() {
    wx.redirectTo({ url: '/pages/order/detail/detail?id=' + this.data.ticket.orderId })
  },

  // 评价
  openRate() {
    this.setData({ rateVisible: true })
  },
  closeRate() {
    this.setData({ rateVisible: false })
  },
  noop() {},
  pickStar(e) {
    const { key, star } = e.currentTarget.dataset
    this.setData({ [key]: Number(star) })
  },
  submitRate() {
    aftersaleApi.rate({
      id: this.id,
      speed: this.data.speed,
      solved: this.data.solved
    }).then(() => {
      toast.success('评价成功')
      this.setData({ rateVisible: false })
      this.load()
    })
  }
})
