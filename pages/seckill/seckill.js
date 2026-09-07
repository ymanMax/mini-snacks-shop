// pages/seckill/seckill.js —— 限时抢购场次页
const homeApi = require('../../api/home.js')
const { countdown, formatPrice } = require('../../utils/format.js')
const toast = require('../../utils/toast.js')

Page({
  data: {
    loading: true,
    sessions: [],
    activeId: 0,
    nextId: 0,
    tabId: 0,
    cdText: '',
    cdH: '00',
    cdM: '00',
    cdS: '00',
    cdLabel: '',
    reminded: {}
  },

  onLoad() {
    this.load()
    this._timer = setInterval(() => this.tick(), 1000)
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  load() {
    homeApi.getSessions().then((res) => {
      const tabId = res.activeId || res.nextId || res.sessions[0].id
      const decorated = res.sessions.map((s) => Object.assign({}, s, {
        goods: s.goods.map((g) => Object.assign({}, g, {
          seckillText: formatPrice(g.seckillPrice),
          origText: formatPrice(g.price, false)
        }))
      }))
      this.setData({
        loading: false,
        sessions: decorated,
        activeId: res.activeId,
        nextId: res.nextId,
        tabId: tabId
      })
      this.tick()
    })
  },

  switchTab(e) {
    this.setData({ tabId: Number(e.currentTarget.dataset.id) })
    this.tick()
  },

  tick() {
    const s = this.data.sessions.find((x) => x.id === this.data.tabId)
    if (!s) return
    const now = Date.now()
    let ms, label
    if (s.status === 1) {
      ms = s.endTime - now
      label = '距本场结束'
    } else if (s.status === 0) {
      ms = s.startTime - now
      label = '距开抢'
    } else {
      ms = 0
      label = '本场已结束'
    }
    const c = countdown(ms)
    this.setData({
      cdText: c.text,
      cdH: String(c.h).padStart(2, '0'),
      cdM: String(c.m).padStart(2, '0'),
      cdS: String(c.s).padStart(2, '0'),
      cdLabel: label
    })
  },

  buy(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  remind(e) {
    const id = e.currentTarget.dataset.id
    homeApi.remind(id).then(() => {
      this.setData({ ['reminded.' + id]: true })
      toast.success('已设置开抢提醒')
    })
  }
})
