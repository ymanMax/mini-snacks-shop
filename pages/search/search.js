// pages/search/search.js — 搜索页（历史 / 热门 / 联想 / 结果）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';

const SORT_TABS = [
  { key: 'comprehensive', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'priceAsc', label: '价格↑' },
  { key: 'priceDesc', label: '价格↓' }
];

Page({
  data: {
    keyword: '',
    mode: 'idle', // idle | result
    sortTabs: SORT_TABS,
    sort: 'comprehensive',

    history: [],
    hot: [],

    suggest: [],
    showSuggest: false,

    // 结果分页
    list: [],
    current: 0,
    size: 10,
    total: 0,
    hasMore: true,
    loading: false,
    firstLoading: false
  },

  onLoad(options) {
    this.loadHistory();
    this.loadHot();
    if (options && options.keyword) {
      this.setData({ keyword: options.keyword });
      this.doSearch(options.keyword);
    }
  },

  onReachBottom() {
    if (this.data.mode === 'result') this.loadResults(false);
  },

  onUnload() {
    if (this._debounce) clearTimeout(this._debounce);
  },

  /* ---------- 基础数据 ---------- */
  loadHistory() {
    api.search.history().then((res) => {
      this.setData({ history: res.data || [] });
    }).catch(() => {});
  },
  loadHot() {
    api.search.hot().then((res) => {
      this.setData({ hot: res.data || [] });
    }).catch(() => {});
  },

  /* ---------- 输入 / 联想 ---------- */
  onKeywordInput(e) {
    const kw = e.detail.value;
    this.setData({ keyword: kw });
    if (this._debounce) clearTimeout(this._debounce);
    if (!kw || !kw.trim()) {
      this.setData({ showSuggest: false, suggest: [], mode: 'idle' });
      return;
    }
    this._debounce = setTimeout(() => {
      api.search.suggest(kw.trim()).then((res) => {
        this.setData({ suggest: res.data || [], showSuggest: true });
      }).catch(() => {});
    }, 300);
  },

  onInputFocus() {
    if (!this.data.keyword || !this.data.keyword.trim()) {
      this.setData({ mode: 'idle', showSuggest: false });
    }
  },

  onClearKeyword() {
    if (this._debounce) clearTimeout(this._debounce);
    this.setData({ keyword: '', suggest: [], showSuggest: false, mode: 'idle' });
  },

  onSuggestTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  /* ---------- 历史 / 热门 ---------- */
  onHistoryTap(e) {
    const kw = e.currentTarget.dataset.kw;
    if (kw) this.doSearch(kw);
  },
  onDeleteHistory(e) {
    const kw = e.currentTarget.dataset.kw;
    api.search.deleteHistory(kw).then((res) => {
      this.setData({ history: res.data || [] });
    }).catch(() => {});
  },
  onClearHistory() {
    toast.confirm('确定清空全部搜索历史吗？').then((ok) => {
      if (!ok) return;
      api.search.clearHistory().then(() => {
        this.setData({ history: [] });
        toast.showToast('已清空搜索历史');
      }).catch(() => {});
    });
  },
  onHotTap(e) {
    const kw = e.currentTarget.dataset.kw;
    if (kw) this.doSearch(kw);
  },

  /* ---------- 执行搜索 ---------- */
  onSearchConfirm() {
    const kw = (this.data.keyword || '').trim();
    if (!kw) {
      toast.showToast('请输入搜索关键词');
      return;
    }
    this.doSearch(kw);
  },

  doSearch(kw) {
    kw = (kw || '').trim();
    if (!kw) return;
    if (this._debounce) clearTimeout(this._debounce);
    // 写入历史
    api.search.addHistory(kw).then((res) => {
      this.setData({ history: res.data || [] });
    }).catch(() => {});
    // 进入结果态
    this.setData({
      keyword: kw,
      mode: 'result',
      showSuggest: false,
      sort: 'comprehensive',
      list: [],
      total: 0,
      current: 0,
      hasMore: true,
      firstLoading: true
    });
    this.loadResults(true);
  },

  onSortTap(e) {
    const sort = e.currentTarget.dataset.sort;
    if (sort === this.data.sort) return;
    this.setData({
      sort,
      list: [],
      total: 0,
      current: 0,
      hasMore: true,
      firstLoading: true
    });
    this.loadResults(true);
  },

  loadResults(reset) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;
    const target = reset ? 1 : this.data.current + 1;
    this.setData({ loading: true });
    api.goods.page({
      keywords: this.data.keyword,
      sort: this.data.sort,
      current: target,
      size: this.data.size
    }).then((res) => {
      const d = res.data || {};
      const records = d.records || [];
      const total = d.total || 0;
      const list = reset ? records : this.data.list.concat(records);
      this.setData({
        list,
        total,
        current: target,
        hasMore: list.length < total,
        loading: false,
        firstLoading: false
      });
    }).catch(() => {
      this.setData({ loading: false, firstLoading: false });
    });
  },

  onBackToIdle() {
    this.setData({ mode: 'idle', keyword: '', showSuggest: false, list: [], total: 0 });
  },

  /* ---------- 图片兜底 ---------- */
  onImgError(e) {
    const ds = e.currentTarget.dataset;
    this.setData({ [ds.list + '[' + ds.index + '].pic']: DEFAULT_IMG });
  }
});
