// pages/order/list/list.js —— 订单列表
const orderApi = require('../../../api/order.js')
const toast = require('../../../utils/toast.js')
const { ORDER_STATUS, ORDER_TABS } = require('../../../utils/constant.js')
const { formatPrice, formatTime } = require('../../../utils/format.js')

const app = getApp()
const SIZE = 10

Page({
  data: {
    tabs: ORDER_TABS,
    activeStatus: 0,
    orders: [],
    current: 1,
    total: 0,
    loadStatus: 'hidden',
    loading: true
  },

  onLoad(options) {
    if (options.status) this.setData({ activeStatus: Number(options.status) })
    this.loadList(true)
  },

  onShow() {
    // 从详情/支付返回后同步状态
    if (this._loaded) this.loadList(true)
    this._loaded = true
  },

  onPullDownRefresh() {
    this.loadList(true)
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  },

  onReachBottom() {
    if (this.data.loadStatus === 'nomore' || this.data.loadStatus === 'loading') return
    this.loadList(false)
  },

  onRetry() {
    this.loadList(false)
  },

  decorate(o) {
    const st = ORDER_STATUS[o.status] || { text: '', color: '#999' }
    const totalCount = o.items.reduce((s, i) => s + i.count, 0)
    return Object.assign({}, o, {
      statusText: st.text,
      statusColor: st.color,
      totalCount: totalCount,
      payAmountText: formatPrice(o.payAmount),
      createTimeShort: o.createTime.slice(5, 16),
      thumbs: o.items.slice(0, 3),
      hiddenCount: o.items.length - 3
    })
  },

  loadList(reset) {
    if (reset) {
      this.setData({ current: 1, orders: [], loadStatus: 'loading', loading: true })
    } else {
      this.setData({ loadStatus: 'loading' })
    }
    const current = reset ? 1 : this.data.current
    orderApi.getList({ status: this.data.activeStatus, current: current, size: SIZE })
      .then((res) => {
        const records = res.records.map((o) => this.decorate(o))
        const orders = reset ? records : this.data.orders.concat(records)
        const hasMore = current * SIZE < res.total
        this.setData({
          loading: false,
          orders: orders,
          current: current + 1,
          total: res.total,
          loadStatus: res.total === 0 ? 'hidden' : (hasMore ? 'hidden' : 'nomore')
        })
      })
      .catch(() => this.setData({ loading: false, loadStatus: 'error' }))
  },

  switchTab(e) {
    const status = Number(e.currentTarget.dataset.status)
    if (status === this.data.activeStatus) return
    this.setData({ activeStatus: status })
    this.loadList(true)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/order/detail/detail?id=' + id })
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' })
  },

  // ---------- 操作 ----------
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    toast.confirm('确定取消该订单吗？', '取消订单').then((ok) => {
      if (!ok) return
      orderApi.cancel(id).then(() => {
        toast.success('已取消')
        this.loadList(true)
      }).catch((err) => toast.fail(err.msg || '取消失败'))
    })
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id
    orderApi.pay(id).then(() => {
      toast.success('支付成功')
      this.loadList(true)
    }).catch(() => {})
  },

  remindSend() {
    toast.showToast('已提醒商家尽快发货')
  },

  confirmOrder(e) {
    const id = e.currentTarget.dataset.id
    toast.confirm('请确认已收到商品', '确认收货').then((ok) => {
      if (!ok) return
      orderApi.confirm(id).then((o) => {
        toast.success('已确认收货，获赠 ' + Math.floor(o.payAmount) + ' 积分')
        this.loadList(true)
      }).catch((err) => toast.fail(err.msg || '操作失败'))
    })
  },

  goReview(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/order/review/review?id=' + id })
  },

  applyAftersale(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/aftersale/apply/apply?orderId=' + id })
  },

  reorder(e) {
    const id = e.currentTarget.dataset.id
    orderApi.reorder(id).then((res) => {
      toast.success('已加入购物车 ' + res.added + ' 件')
      app.refreshCartBadge()
    }).catch((err) => toast.fail((err && err.msg) || '操作失败'))
  }
})
