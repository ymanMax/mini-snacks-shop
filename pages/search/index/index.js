// pages/search/index/index.js —— 历史 / 热词 / 联想 / 结果排序分页
const app = getApp();
const { goodsApi, cartApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const HISTORY_KEY = 'mock_search_history';
const MAX_HISTORY = 15;

Page({
  data: {
    kw: '',
    hotWords: [],
    history: [],
    suggests: [],
    searched: false,
    results: [],
    sort: 'default',
    sorts: [
      { key: 'default', label: '综合' },
      { key: 'sales', label: '销量' },
      { key: 'priceAsc', label: '价格' }
    ],
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden',
    loading: false
  },

  onLoad() {
    goodsApi.getHotKeywords().then((list) => this.setData({ hotWords: list }));
    this.setData({ history: wx.getStorageSync(HISTORY_KEY) || [] });
  },

  onInput(e) {
    const kw = e.detail.value;
    this.setData({ kw, suggests: kw ? this.data.suggests : [] });
    if (!kw) return;
    goodsApi.getSuggest(kw).then((list) => this.setData({ suggests: list })).catch(() => {});
  },

  onClear() {
    this.setData({ kw: '', suggests: [], searched: false, results: [] });
  },

  // 触发搜索
  doSearch(e) {
    const kw = (e.currentTarget.dataset.kw || this.data.kw || '').trim();
    if (!kw) {
      toast.showToast('请输入搜索关键词');
      return;
    }
    this.saveHistory(kw);
    this.setData({
      kw,
      searched: true,
      suggests: [],
      results: [],
      sort: 'default',
      page: 1
    });
    this.loadResults(true);
  },

  loadResults(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading', loading: reset });
    goodsApi.getPage({
      current: page,
      size: this.data.size,
      keywords: this.data.kw,
      sort: this.data.sort
    }).then((res) => {
      const list = reset ? res.records : this.data.results.concat(res.records);
      this.setData({
        results: list,
        total: res.total,
        page: page + 1,
        loading: false,
        loadStatus: list.length >= res.total ? 'nomore' : 'hidden'
      });
    }).catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  switchSort(e) {
    const sort = e.currentTarget.dataset.key;
    if (sort === this.data.sort) return;
    this.setData({ sort });
    this.loadResults(true);
  },

  onReachBottom() {
    if (this.data.results.length < this.data.total && this.data.loadStatus !== 'loading') {
      this.loadResults(false);
    }
  },

  // 历史记录
  saveHistory(kw) {
    let list = (wx.getStorageSync(HISTORY_KEY) || []).filter((x) => x !== kw);
    list.unshift(kw);
    list = list.slice(0, MAX_HISTORY);
    wx.setStorageSync(HISTORY_KEY, list);
    this.setData({ history: list });
  },
  removeHistory(e) {
    const kw = e.currentTarget.dataset.kw;
    const list = this.data.history.filter((x) => x !== kw);
    wx.setStorageSync(HISTORY_KEY, list);
    this.setData({ history: list });
  },
  clearHistory() {
    if (!this.data.history.length) return;
    wx.setStorageSync(HISTORY_KEY, []);
    this.setData({ history: [] });
  },

  onAddCart(e) {
    const g = e.detail.goods;
    const taste = g.specs[1] && g.specs[1].values[0] ? g.specs[1].values[0].label : '原味';
    cartApi.add({ goodsId: g.id, count: 1, specText: '标准装 · ' + taste, price: g.price })
      .then(() => {
        toast.showSuccess('已加入购物车');
        app.updateCartBadge();
      });
  }
});
