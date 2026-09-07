// pages/address/address.js —— 收货地址列表
const addressApi = require('../../api/address.js')
const toast = require('../../utils/toast.js')

const FILTERS = [
  { tag: '', label: '全部' },
  { tag: '家', label: '家' },
  { tag: '学校', label: '学校' },
  { tag: '公司', label: '公司' }
]

Page({
  data: {
    list: [],
    from: '',
    filters: FILTERS,
    activeTag: '',
    rangeKm: 15
  },

  onLoad(options) {
    this.setData({ from: options.from || '' })
  },

  onShow() {
    this.load()
  },

  load() {
    addressApi.getList(this.data.activeTag).then((list) => this.setData({ list: list }))
  },

  pickTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ activeTag: tag })
    this.load()
  },

  select(e) {
    if (this.data.from !== 'confirm') return
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((a) => a.id === id)
    if (item.outRange) {
      toast.showToast('该地址超出配送范围')
      return
    }
    wx.setStorageSync('selectedAddressId', id)
    wx.navigateBack()
  },

  edit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/newAddress/newAddress?id=' + id + (this.data.from ? '&from=' + this.data.from : '') })
  },

  add() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress' + (this.data.from ? '?from=' + this.data.from : '') })
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id
    addressApi.setDefault(id).then(() => {
      toast.showToast('已设为默认')
      this.load()
    })
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    toast.confirm('确定删除该收货地址吗？', '删除地址').then((ok) => {
      if (!ok) return
      addressApi.remove(id).then(() => {
        toast.success('已删除')
        this.load()
      })
    })
  }
})
