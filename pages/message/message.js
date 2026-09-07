// pages/message/message.js —— 消息中心
const messageApi = require('../../api/message.js')
const { MESSAGE_TYPE } = require('../../utils/constant.js')
const { fromNow } = require('../../utils/format.js')

const SIZE = 10
const TABS = [
  { type: 0, label: '全部', icon: '🔔' },
  { type: 1, label: '系统', icon: '📢' },
  { type: 2, label: '订单', icon: '📦' },
  { type: 3, label: '促销', icon: '🎉' },
  { type: 4, label: '互动', icon: '💬' }
]

Page({
  data: {
    tabs: TABS,
    active: 0,
    messages: [],
    current: 1,
    total: 0,
    loadStatus: 'hidden',
    loading: true
  },

  onShow() {
    this.load(true)
  },

  onPullDownRefresh() {
    this.load(true)
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  },

  onReachBottom() {
    if (this.data.loadStatus === 'nomore' || this.data.loadStatus === 'loading') return
    this.load(false)
  },

  onRetry() {
    this.load(false)
  },

  decorate(list) {
    return list.map((m) => Object.assign({}, m, {
      typeText: (MESSAGE_TYPE[m.type] || {}).text || '系统',
      timeText: fromNow(m.createTime),
      icon: TABS[m.type] ? TABS[m.type].icon : '🔔'
    }))
  },

  load(reset) {
    if (reset) this.setData({ current: 1, messages: [], loadStatus: 'loading', loading: true })
    else this.setData({ loadStatus: 'loading' })
    const current = reset ? 1 : this.data.current
    messageApi.getList({ type: this.data.active || '', current: current, size: SIZE }).then((res) => {
      const records = reset ? this.decorate(res.records) : this.data.messages.concat(this.decorate(res.records))
      const hasMore = current * SIZE < res.total
      this.setData({
        messages: records,
        current: current + 1,
        total: res.total,
        loading: false,
        loadStatus: res.total === 0 ? 'hidden' : (hasMore ? 'hidden' : 'nomore')
      })
    })
  },

  switchTab(e) {
    this.setData({ active: Number(e.currentTarget.dataset.type) })
    this.load(true)
  },

  // 消息 -> 页面路由表
  buildUrl(m) {
    const link = m.link
    if (!link) return ''
    switch (link.type) {
      case 'order':
        return '/pages/order/detail/detail?id=' + link.id
      case 'goods':
        return '/pages/detail/detail?id=' + link.id
      case 'coupon':
        return '/pages/coupon/coupon'
      case 'seckill':
        return '/pages/seckill/seckill'
      case 'group':
        return '/pages/group/detail/detail?id=' + link.id
      case 'groupList':
        return '/pages/group/group'
      case 'aftersale':
        return '/pages/aftersale/detail/detail?id=' + link.id
      case 'member':
        return '/pages/member/center/center'
      default:
        return ''
    }
  },

  readOne(e) {
    const id = e.currentTarget.dataset.id
    const m = this.data.messages.find((x) => x.id === id)
    if (!m) return
    const go = () => {
      const url = this.buildUrl(m)
      if (url) wx.navigateTo({ url, fail: () => wx.switchTab({ url: '/pages/index/index' }) })
    }
    if (!m.isRead) {
      messageApi.read(id).then(() => {
        m.isRead = true
        this.setData({ messages: this.data.messages })
        go()
      })
    } else {
      go()
    }
  },

  readAll() {
    messageApi.readAll().then(() => {
      wx.showToast({ title: '全部已读', icon: 'success' })
      this.load(true)
    })
  }
})
