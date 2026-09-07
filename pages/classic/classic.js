// pages/classic/classic.js —— 分类页
const homeApi = require('../../api/home.js')
const goodsApi = require('../../api/goods.js')
const { quickAdd } = require('../../utils/cart.js')

const app = getApp()
const SIZE = 10

const PRICE_RANGES = [
  { label: '全部价格', min: '', max: '' },
  { label: '0-50 元', min: 0, max: 50 },
  { label: '50-100 元', min: 50, max: 100 },
  { label: '100-200 元', min: 100, max: 200 },
  { label: '200 元以上', min: 200, max: '' }
]
const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'priceAsc', label: '价格↑' },
  { key: 'priceDesc', label: '价格↓' }
]

Page({
  data: {
    cats: [],
    activeCat: 1,
    sorts: SORTS,
    sort: 'default',
    priceRanges: PRICE_RANGES,
    priceIndex: 0,
    origins: [],
    originOptions: [],
    selectedOrigins: [],
    onlyStock: false,
    filterVisible: false,
    // 面板内临时选择（点确定才生效）
    tempPriceIndex: 0,
    tempOrigins: [],
    tempOnlyStock: false,
    filterCount: 0,
    goods: [],
    current: 1,
    total: 0,
    loadStatus: 'hidden',
    loading: true
  },

  onLoad() {
    homeApi.getCategories().then((cats) => {
      this.setData({ cats: cats })
      this.selectCat({ currentTarget: { dataset: { id: app.globalData.pendingCategory || 1 } } })
      app.globalData.pendingCategory = null
    })
  },

  onShow() {
    if (app.globalData.pendingCategory) {
      const id = app.globalData.pendingCategory
      app.globalData.pendingCategory = null
      if (id !== this.data.activeCat) this.selectCat({ currentTarget: { dataset: { id: id } } })
    }
  },

  selectCat(e) {
    const id = Number(e.currentTarget.dataset.id)
    this.setData({
      activeCat: id,
      goods: [],
      current: 1,
      loading: true,
      sort: 'default',
      priceIndex: 0,
      selectedOrigins: [],
      onlyStock: false,
      filterCount: 0
    })
    goodsApi.getFilterMeta(id).then((meta) => {
      this.setData({
        origins: meta.origins,
        originOptions: meta.origins.map((o) => ({ name: o, selected: false }))
      })
    })
    this.loadGoods(true)
  },

  buildParams(current) {
    const r = PRICE_RANGES[this.data.priceIndex]
    return {
      current: current,
      size: SIZE,
      categoryId: this.data.activeCat,
      sort: this.data.sort,
      minPrice: r.min,
      maxPrice: r.max,
      origins: this.data.selectedOrigins.join(','),
      onlyStock: this.data.onlyStock ? 1 : ''
    }
  },

  loadGoods(reset) {
    if (reset) {
      this.setData({ current: 1, loadStatus: 'loading' })
    } else {
      if (this.data.loadStatus === 'loading' || this.data.loadStatus === 'nomore') return
      this.setData({ loadStatus: 'loading' })
    }
    const current = reset ? 1 : this.data.current
    goodsApi.getList(this.buildParams(current)).then((res) => {
      const goods = reset ? res.records : this.data.goods.concat(res.records)
      const hasMore = current * SIZE < res.total
      this.setData({
        loading: false,
        goods: goods,
        current: current + 1,
        total: res.total,
        loadStatus: res.total === 0 ? 'hidden' : (hasMore ? 'hidden' : 'nomore')
      })
    }).catch(() => {
      this.setData({ loading: false, loadStatus: 'error' })
    })
  },

  onReachBottom() {
    if (this.data.loadStatus === 'nomore' || this.data.total === 0) return
    this.loadGoods(false)
  },

  onRetry() {
    this.loadGoods(false)
  },

  onPullDownRefresh() {
    this.loadGoods(true)
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  },

  // ---- 排序 ----
  switchSort(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.sort) return
    this.setData({ sort: key })
    this.loadGoods(true)
  },

  // ---- 筛选面板 ----
  openFilter() {
    const opts = this.data.origins.map((o) => ({
      name: o,
      selected: this.data.selectedOrigins.indexOf(o) > -1
    }))
    this.setData({
      filterVisible: true,
      originOptions: opts,
      tempPriceIndex: this.data.priceIndex,
      tempOrigins: this.data.selectedOrigins.slice(),
      tempOnlyStock: this.data.onlyStock
    })
  },
  closeFilter() {
    this.setData({ filterVisible: false })
  },
  noop() {},
  pickPrice(e) {
    this.setData({ tempPriceIndex: Number(e.currentTarget.dataset.index) })
  },
  toggleOrigin(e) {
    const index = Number(e.currentTarget.dataset.index)
    const key = 'originOptions[' + index + '].selected'
    const obj = {}
    obj[key] = !this.data.originOptions[index].selected
    this.setData(obj)
    this.setData({
      tempOrigins: this.data.originOptions.filter((o) => o.selected).map((o) => o.name)
    })
  },
  toggleOnlyStock() {
    this.setData({ tempOnlyStock: !this.data.tempOnlyStock })
  },
  resetFilter() {
    const opts = this.data.originOptions.map((o) => ({ name: o.name, selected: false }))
    this.setData({ tempPriceIndex: 0, tempOrigins: [], tempOnlyStock: false, originOptions: opts })
  },
  confirmFilter() {
    let count = this.data.tempOrigins.length
    if (this.data.tempPriceIndex !== 0) count++
    if (this.data.tempOnlyStock) count++
    this.setData({
      filterVisible: false,
      priceIndex: this.data.tempPriceIndex,
      selectedOrigins: this.data.tempOrigins,
      onlyStock: this.data.tempOnlyStock,
      filterCount: count
    })
    this.loadGoods(true)
  },
  clearFilter() {
    this.setData({
      priceIndex: 0,
      selectedOrigins: [],
      onlyStock: false,
      filterCount: 0,
      sort: 'default'
    })
    this.loadGoods(true)
  },

  onAdd(e) {
    quickAdd(e.detail.item)
  }
})
