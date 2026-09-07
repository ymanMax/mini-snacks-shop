// pages/aftersale/list/list.js —— 售后工单列表
const aftersaleApi = require('../../../api/aftersale.js')

const TABS = [
  { key: '', label: '全部' },
  { key: '99', label: '处理中' },
  { key: '3', label: '已完成' },
  { key: '4', label: '已取消' }
]

Page({
  data: {
    tabs: TABS,
    active: '',
    list: [],
    loading: true
  },

  onShow() {
    this.load()
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.key })
    this.load()
  },

  load() {
    aftersaleApi.getList({ status: this.data.active || '', current: 1, size: 20 }).then((res) => {
      this.setData({ list: res.records, loading: false })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/aftersale/detail/detail?id=' + id })
  },

  goOrder() {
    wx.navigateTo({ url: '/pages/order/list/list?status=5' })
  }
})
