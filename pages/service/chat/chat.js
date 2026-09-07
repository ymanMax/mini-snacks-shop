// pages/service/chat/chat.js —— 客服会话（规则引擎在 Mock 端）
const serviceApi = require('../../../api/service.js')
const toast = require('../../../utils/toast.js')

Page({
  data: {
    messages: [],
    quickQuestions: [],
    input: '',
    rate: null,
    rateVisible: false,
    speed: 5,
    solved: 5,
    scrollToId: ''
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    serviceApi.history().then((res) => {
      this.setData({
        messages: res.messages,
        quickQuestions: res.quickQuestions,
        rate: res.rate
      })
      this.scrollBottom()
    })
  },

  scrollBottom() {
    const id = 'msg-' + this.data.messages.length
    setTimeout(() => this.setData({ scrollToId: id }), 60)
  },

  onInput(e) {
    this.setData({ input: e.detail.value })
  },

  sendText(text) {
    const t = (text || this.data.input).trim()
    if (!t) return
    this.setData({ input: '' })
    // 乐观渲染用户消息 + “正在输入”
    const temp = this.data.messages.concat([{ me: true, text: t, time: '' }])
    this.setData({ messages: temp.concat([{ me: false, typing: true, text: '正在输入...' }]) })
    this.scrollBottom()
    serviceApi.send(t).then((res) => {
      this.setData({ messages: res.messages })
      this.scrollBottom()
    })
  },

  send() {
    this.sendText()
  },

  pickQuick(e) {
    const q = e.currentTarget.dataset.q
    this.sendText(q)
  },

  // ---------- 客服评价 ----------
  openRate() {
    this.setData({ rateVisible: true, speed: 5, solved: 5 })
  },
  closeRate() {
    this.setData({ rateVisible: false })
  },
  pickStar(e) {
    const { key, star } = e.currentTarget.dataset
    this.setData({ [key]: Number(star) })
  },
  submitRate() {
    serviceApi.rate({ speed: this.data.speed, solved: this.data.solved }).then(() => {
      toast.success('感谢您的评价')
      this.setData({
        rateVisible: false,
        rate: { speed: this.data.speed, solved: this.data.solved }
      })
    })
  },

  goAftersale() {
    wx.navigateTo({ url: '/pages/aftersale/list/list' })
  },

  noop() {}
})
