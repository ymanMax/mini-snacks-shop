// pages/group/group.js —— 拼团
const groupApi = require('../../api/group.js')
const { countdown, formatPrice } = require('../../utils/format.js')
const toast = require('../../utils/toast.js')

Page({
  data: {
    tab: 'active',
    groups: [],
    mine: []
  },

  onShow() {
    this.load()
    if (this._timer) clearInterval(this._timer)
    this._timer = setInterval(() => this.tick(), 1000)
    this.tick()
  },

  onHide() {
    if (this._timer) clearInterval(this._timer)
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  load() {
    groupApi.getList('active').then((list) => {
      this.setData({ groups: this.decorate(list) })
      this.tick()
    })
    groupApi.getList('mine').then((list) => this.setData({ mine: this.decorate(list, true) }))
  },

  decorate(list, mine) {
    return list.map((g) => {
      const slots = []
      for (let i = 0; i < g.requiredCount; i++) {
        slots.push(g.members[i] || { empty: true })
      }
      return Object.assign({}, g, {
        slots: slots,
        remain: g.requiredCount - g.joinedCount,
        cdText: '',
        groupText: formatPrice(g.groupPrice),
        origText: formatPrice(g.originalPrice, false),
        mine: !!mine
      })
    })
  },

  tick() {
    const groups = this.data.groups.map((g) => {
      if (g.status !== 1) return g
      const c = countdown(g.endTime - Date.now())
      return Object.assign({}, g, { cdText: c.text })
    })
    this.setData({ groups: groups })
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  join(e) {
    const id = e.currentTarget.dataset.id
    const g = this.data.groups.find((x) => x.id === id)
    if (!g) return
    toast.confirm('参团后模拟拼团成功，' + g.groupPrice + ' 元拼单价购买「' + g.name + '」，是否继续？', '我要参团').then((ok) => {
      if (!ok) return
      groupApi.join(id).then((res) => {
        if (res.completed) toast.success('拼团成功！商品将尽快发出')
        else toast.success('参团成功，快邀请好友成团')
        this.load()
      }).catch((err) => toast.showToast((err && err.msg) || '参团失败'))
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.goods
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  goGroupDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/group/detail/detail?id=' + id })
  }
})
