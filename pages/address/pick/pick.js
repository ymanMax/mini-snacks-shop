// pages/address/pick/pick.js —— 地图选点（mock）
const addressApi = require('../../../api/address.js')
const toast = require('../../../utils/toast.js')

Page({
  data: {
    pois: [],
    filtered: [],
    selected: null,
    keyword: '',
    locating: false,
    marker: { x: 50, y: 46 }
  },

  onLoad() {
    this.loadPois()
  },

  loadPois(keyword) {
    addressApi.getPois(keyword).then((list) => {
      const decorated = list.map((p) => Object.assign({}, p, {
        x: 30 + (p.id % 5) * 11,
        y: 24 + (p.id % 4) * 15,
        freightText: p.outRange ? '暂不支持配送' : (p.distanceKm > 3 ? '运费约 ￥' + (5 + Math.ceil(p.distanceKm - 3)) : '运费约 ￥5')
      }))
      this.setData({ pois: decorated, filtered: decorated })
    })
  },

  onSearch(e) {
    const kw = e.detail.value
    this.setData({ keyword: kw })
    const list = kw
      ? this.data.pois.filter((p) => p.name.indexOf(kw) > -1 || p.address.indexOf(kw) > -1)
      : this.data.pois
    this.setData({ filtered: list })
  },

  // 模拟定位
  locate() {
    this.setData({ locating: true })
    addressApi.locate().then((p) => {
      setTimeout(() => {
        this.setData({
          locating: false,
          selected: p,
          marker: { x: 30, y: 24 },
          keyword: '',
          filtered: this.data.pois
        })
        toast.success('定位成功：' + p.name)
      }, 800)
    })
  },

  selectPoi(e) {
    const id = e.currentTarget.dataset.id
    const p = this.data.pois.find((x) => x.id === id)
    this.setData({ selected: p, marker: { x: p.x, y: p.y } })
  },

  confirm() {
    if (!this.data.selected) {
      toast.showToast('请选择一个地点')
      return
    }
    if (this.data.selected.outRange) {
      toast.showToast('该地点超出配送范围，请重新选择')
      return
    }
    wx.setStorageSync('selectedPoi', this.data.selected)
    wx.navigateBack()
  }
})
