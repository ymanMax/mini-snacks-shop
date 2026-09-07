// pages/search/index/index.js —— 搜索页
const searchApi = require('../../../api/search.js')
const { quickAdd } = require('../../../utils/cart.js')
const toast = require('../../../utils/toast.js')
const { formatPrice } = require('../../../utils/format.js')

const HISTORY_KEY = 'search_history'
const SIZE = 10

Page({
  data: {
    keyword: '',
    phase: 'home', // home | suggest | result
    history: [],
    hot: [],
    suggests: [],
    results: [],
    sorts: [
      { key: 'default', label: '综合' },
      { key: 'sales', label: '销量优先' },
      { key: 'priceAsc', label: '价格从低到高' },
      { key: 'priceDesc', label: '价格从高到低' }
    ],
    sort: 'default',
    current: 1,
    total: 0,
    loadStatus: 'hidden',
    searchedWord: ''
  },

  onLoad() {
    const history = wx.getStorageSync(HISTORY_KEY) || []
    this.setData({ history: history })
    searchApi.getHot().then((hot) => this.setData({ hot: hot }))
  },

  onInput(e) {
    const kw = e.detail.value
    if (!kw.trim()) {
      this.setData({ keyword: kw, phase: 'home', suggests: [] })
      return
    }
    this.setData({ keyword: kw })
    searchApi.suggest(kw).then((list) => {
      const suggests = list.map((g) => Object.assign({}, g, { priceText: formatPrice(g.price, false) }))
      this.setData({ suggests: suggests, phase: 'suggest' })
    })
  },

  onClear() {
    this.setData({ keyword: '', phase: 'home', suggests: [], results: [] })
  },

  onCancel() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  },

  // 执行搜索
  doSearch(e) {
    const kw = (e.currentTarget.dataset.kw || this.data.keyword || '').trim()
    if (!kw) {
      toast.showToast('请输入搜索关键词')
      return
    }
    // 写历史（最多 15 条，去重置顶）
    let history = wx.getStorageSync(HISTORY_KEY) || []
    history = [kw].concat(history.filter((x) => x !== kw)).slice(0, 15)
    wx.setStorageSync(HISTORY_KEY, history)

    this.setData({
      keyword: kw,
      searchedWord: kw,
      phase: 'result',
      history: history,
      results: [],
      current: 1,
      sort: 'default',
      loadStatus: 'loading'
    })
    this.loadResults(true)
  },

  loadResults(reset) {
    const current = reset ? 1 : this.data.current
    searchApi.search({
      keywords: this.data.searchedWord,
      current: current,
      size: SIZE,
      sort: this.data.sort
    }).then((res) => {
      const results = reset ? res.records : this.data.results.concat(res.records)
      const hasMore = current * SIZE < res.total
      this.setData({
        results: results,
        current: current + 1,
        total: res.total,
        loadStatus: res.total === 0 ? 'hidden' : (hasMore ? 'hidden' : 'nomore')
      })
    }).catch(() => this.setData({ loadStatus: 'error' }))
  },

  onReachBottom() {
    if (this.data.phase !== 'result' || this.data.loadStatus === 'nomore') return
    if (this.data.loadStatus === 'loading') return
    this.setData({ loadStatus: 'loading' })
    this.loadResults(false)
  },

  onRetry() {
    this.loadResults(false)
  },

  switchSort(e) {
    const sort = e.currentTarget.dataset.key
    if (sort === this.data.sort) return
    this.setData({ sort: sort, loadStatus: 'loading' })
    this.loadResults(true)
  },

  // 联想点击
  pickSuggest(e) {
    const kw = e.currentTarget.dataset.kw
    this.doSearch({ currentTarget: { dataset: { kw: kw } } })
  },

  // 历史管理
  removeHistory(e) {
    const kw = e.currentTarget.dataset.kw
    const history = this.data.history.filter((x) => x !== kw)
    wx.setStorageSync(HISTORY_KEY, history)
    this.setData({ history: history })
  },

  clearHistory() {
    if (!this.data.history.length) return
    toast.confirm('确定清空搜索历史吗？').then((ok) => {
      if (!ok) return
      wx.removeStorageSync(HISTORY_KEY)
      this.setData({ history: [] })
    })
  },

  onAdd(e) {
    quickAdd(e.detail.item)
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
