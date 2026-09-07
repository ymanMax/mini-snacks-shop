// pages/order/detail/detail.js —— 订单详情
const orderApi = require('../../../api/order.js')
const toast = require('../../../utils/toast.js')
const { ORDER_STATUS } = require('../../../utils/constant.js')
const { formatPrice } = require('../../../utils/format.js')

const app = getApp()

Page({
  data: {
    id: null,
    loading: true,
    order: null,
    statusText: '',
    statusColor: '',
    payAmountText: '',
    goodsTotalText: '',
    freightText: '',
    discountText: '-￥0.00',
    steps: []
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.load()
  },

  onShow() {
    if (this._loaded) this.load()
    this._loaded = true
  },

  load() {
    orderApi.getDetail(this.data.id).then((raw) => {
      const st = ORDER_STATUS[raw.status] || { text: '', color: '#999' }
      const o = Object.assign({}, raw, {
        items: raw.items.map((it) => Object.assign({}, it, { priceText: formatPrice(it.price) })),
        couponDiscount: raw.discountAmount - raw.fullReduce
      })
      this.setData({
        loading: false,
        order: o,
        statusText: st.text,
        statusColor: st.color,
        payAmountText: formatPrice(o.payAmount),
        goodsTotalText: formatPrice(o.goodsTotal),
        freightText: o.freight === 0 ? '免配送费' : formatPrice(o.freight),
        discountText: '-￥' + o.discountAmount.toFixed(2),
        steps: this.buildSteps(o)
      })
    }).catch((err) => {
      this.setData({ loading: false })
      toast.fail((err && err.msg) || '订单不存在')
    })
  },

  buildSteps(o) {
    return (o.timeline || []).map((t, i, arr) => {
      const isCancel = t.status.indexOf('取消') > -1
      return {
        time: t.time,
        title: t.status,
        remark: t.remark,
        state: isCancel ? 'cancel' : 'done',
        last: i === arr.length - 1,
        current: i === arr.length - 1 && o.status !== 5 && o.status !== 6
      }
    })
  },

  copyOrderNo() {
    wx.setClipboardData({
      data: this.data.order.orderNo,
      success: () => toast.showToast('订单号已复制')
    })
  },

  callRider() {
    const phone = this.data.order.rider && this.data.order.rider.phone
    if (!phone) return
    // 演示号码为脱敏号，仅做展示
    toast.showToast('演示环境：骑手电话 ' + phone)
  },

  // ---------- 状态流转 ----------
  payOrder() {
    orderApi.pay(this.data.id).then(() => {
      toast.success('支付成功')
      this.load()
    }).catch(() => {})
  },

  cancelOrder() {
    toast.confirm('确定取消该订单吗？', '取消订单').then((ok) => {
      if (!ok) return
      orderApi.cancel(this.data.id).then(() => {
        toast.success('已取消')
        this.load()
      }).catch((err) => toast.fail(err.msg || '取消失败'))
    })
  },

  // 演示入口：模拟配送进度推进（待发货→配送中→待收货）
  advance() {
    const o = this.data.order
    const label = o.status === 2 ? '商家已开始分拣并呼叫骑手，确认推进到「配送中」？' : '骑手即将送达，确认推进到「待收货」？'
    toast.confirm(label, '模拟配送进度').then((ok) => {
      if (!ok) return
      orderApi.advance(this.data.id).then(() => {
        toast.success('配送状态已更新')
        this.load()
      }).catch((err) => toast.showToast((err && err.msg) || '当前状态无需推进'))
    })
  },

  confirmOrder() {
    toast.confirm('请确认已收到商品', '确认收货').then((ok) => {
      if (!ok) return
      orderApi.confirm(this.data.id).then((o) => {
        toast.success('已收货，获赠 ' + Math.floor(o.payAmount) + ' 积分')
        this.load()
      }).catch((err) => toast.fail((err && err.msg) || '操作失败'))
    })
  },

  goReview() {
    wx.navigateTo({ url: '/pages/order/review/review?id=' + this.data.id })
  },

  applyAftersale() {
    wx.navigateTo({ url: '/pages/aftersale/apply/apply?orderId=' + this.data.id })
  },

  reorder() {
    orderApi.reorder(this.data.id).then((res) => {
      toast.success('已加入购物车 ' + res.added + ' 件')
      app.refreshCartBadge()
    }).catch((err) => toast.fail((err && err.msg) || '操作失败'))
  },

  goList() {
    wx.redirectTo({ url: '/pages/order/list/list' })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
