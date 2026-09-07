// pages/search/index.js —— 搜索页（优化 10：历史 / 热词 / 联想 / 结果排序分页）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const HISTORY_KEY = 'mock_search_history';
const MAX_HISTORY = 15;

const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'price_asc', label: '价格↑' },
  { key: 'price_desc', label: '价格↓' },
  { key: 'sales', label: '销量' }
];

Page({
  data: {
    keyword: '',
    focusInput: true,
    mode: 'home', // home（历史+热词） | suggest（联想） | result（结果）
    history: [],
    hotWords: [],
    suggests: [],
    sorts: SORTS,
    sort: 'default',
    // 结果分页
    list: [],
    current: 1,
    size: 10,
    total: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.setData({ history: this.readHistory() });
    api.getHotWords()
      .then(words => this.setData({ hotWords: words || [] }))
      .catch(() => {});
  },

  onUnload() {
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
  },

  onReachBottom() {
    if (this.data.mode !== 'result' || this.data.loading || this.data.noMore) return;
    this.loadResult(this.data.current + 1);
  },

  // ---------- 搜索历史（纯前端偏好，允许 storage） ----------
  readHistory() {
    try {
      return wx.getStorageSync(HISTORY_KEY) || [];
    } catch (e) {
      return [];
    }
  },

  writeHistory(kw) {
    let history = this.readHistory().filter(w => w !== kw);
    history.unshift(kw);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    try { wx.setStorageSync(HISTORY_KEY, history); } catch (e) {}
    this.setData({ history });
  },

  onDeleteHistory(e) {
    const word = e.currentTarget.dataset.word;
    const history = this.data.history.filter(w => w !== word);
    try { wx.setStorageSync(HISTORY_KEY, history); } catch (e) {}
    this.setData({ history });
  },

  onClearHistory() {
    try { wx.removeStorageSync(HISTORY_KEY); } catch (e) {}
    this.setData({ history: [] });
  },

  // ---------- 输入与联想 ----------
  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    const kw = keyword.trim();
    if (!kw) {
      this.setData({ mode: 'home', suggests: [] });
      return;
    }
    if (this.data.mode === 'result') this.setData({ mode: 'suggest' });
    // 防抖 300ms
    this.suggestTimer = setTimeout(() => this.fetchSuggest(kw), 300);
  },

  // 结果态点击搜索框：返回联想态，可修改关键词重新搜索
  onFocus() {
    const kw = this.data.keyword.trim();
    if (this.data.mode === 'result' && kw) {
      this.setData({ mode: 'suggest' });
      this.fetchSuggest(kw);
    }
  },

  onBlur() {
    if (this.data.focusInput) this.setData({ focusInput: false });
  },

  fetchSuggest(kw) {
    api.getSuggest(kw)
      .then(list => {
        // 关键词已变化或已进入结果态时丢弃旧结果
        if (this.data.mode === 'result') return;
        if (this.data.keyword.trim() !== kw) return;
        this.setData({ suggests: list || [], mode: 'suggest' });
      })
      .catch(() => {});
  },

  onConfirm() {
    this.doSearch(this.data.keyword);
  },

  onWordTap(e) {
    this.doSearch(e.currentTarget.dataset.word);
  },

  doSearch(kw) {
    kw = String(kw || '').trim();
    if (!kw) {
      toast.showToast('请输入搜索关键词');
      return;
    }
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    this.writeHistory(kw);
    this.setData({
      keyword: kw,
      mode: 'result',
      suggests: [],
      sort: 'default',
      list: [],
      current: 1,
      noMore: false
    });
    this.loadResult(1);
  },

  onSortTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.sort) return;
    this.setData({ sort: key, list: [], current: 1, noMore: false });
    this.loadResult(1);
  },

  loadResult(page) {
    if (this.data.loading) return Promise.resolve();
    this.setData({ loading: true });
    return api.getGoodsList({
      keywords: this.data.keyword.trim(),
      sort: this.data.sort,
      current: page,
      size: this.data.size
    })
      .then(res => {
        const records = res.records || [];
        const list = page === 1 ? records : this.data.list.concat(records);
        this.setData({
          list,
          current: page,
          total: res.total || 0,
          noMore: records.length < this.data.size || list.length >= (res.total || 0)
        });
      })
      .catch(() => {})
      .finally(() => this.setData({ loading: false }));
  },

  // ---------- 跳转 ----------
  onSuggestTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/index/index' })
    });
  },

  onAddCart(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    const spec0 = item.specs && item.specs[0] && item.specs[0].values[0];
    const spec1 = item.specs && item.specs[1] && item.specs[1].values[0];
    const specText = (spec0 ? spec0.label : '默认规格') + (spec1 ? ' · ' + spec1.label : '');
    const price = spec0 && spec0.price != null ? spec0.price : item.minPrice;
    api.addToCart({ goodsId: item.id, specText, price, count: 1 })
      .then(() => {
        toast.success('已加入购物车');
        getApp().refreshCartBadge();
      })
      .catch(() => {});
  },

  // ---------- 图片兜底（契约 §5） ----------
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
