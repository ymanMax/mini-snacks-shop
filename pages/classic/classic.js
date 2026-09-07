// pages/classic/classic.js —— 分类页（优化 4：左侧分类导航 / 吸顶排序筛选 / 半屏筛选弹层 / 分页）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'price_asc', label: '价格↑' },
  { key: 'price_desc', label: '价格↓' },
  { key: 'sales', label: '销量' }
];

const PRICE_RANGES = ['0-50', '50-100', '100-200', '200+'];

const EMPTY_FILTER = () => ({ priceRange: '', origins: [], inStock: false });

Page({
  data: {
    categories: [],
    activeCat: 0,
    sorts: SORTS,
    sort: 'default',
    priceRanges: PRICE_RANGES,
    originOptions: [],
    // 已生效的筛选条件与弹层中编辑中的条件
    filter: EMPTY_FILTER(),
    tempFilter: EMPTY_FILTER(),
    filterVisible: false,
    // 列表分页
    list: [],
    current: 1,
    size: 10,
    total: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    api.getCategories().then(cats => {
      const categories = cats || [];
      this.setData({
        categories,
        activeCat: categories.length ? categories[0].id : 0
      });
      this.loadOrigins();
      this.loadGoods(1);
    }).catch(() => {});
  },

  onShow() {
    getApp().refreshCartBadge();
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore || !this.data.activeCat) return;
    this.loadGoods(this.data.current + 1);
  },

  // ---------- 取数 ----------
  buildQuery(page) {
    const f = this.data.filter;
    const q = {
      categoryId: this.data.activeCat,
      sort: this.data.sort,
      current: page,
      size: this.data.size
    };
    if (f.priceRange) q.priceRange = f.priceRange;
    if (f.origins.length) q.origins = f.origins.join(',');
    if (f.inStock) q.inStock = 1;
    return q;
  },

  loadGoods(page) {
    if (this.data.loading || !this.data.activeCat) return Promise.resolve();
    this.setData({ loading: true });
    return api.getGoodsList(this.buildQuery(page))
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

  reload() {
    this.setData({ list: [], current: 1, noMore: false });
    this.loadGoods(1);
  },

  // 聚合当前分类下的产地（供筛选面板多选）
  loadOrigins() {
    api.getGoodsList({ categoryId: this.data.activeCat, current: 1, size: 30 })
      .then(res => {
        const seen = {};
        (res.records || []).forEach(g => { if (g.origin) seen[g.origin] = true; });
        this.setData({ originOptions: Object.keys(seen) });
      })
      .catch(() => {});
  },

  // ---------- 分类 / 排序 ----------
  onCatTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (id === this.data.activeCat) return;
    this.setData({ activeCat: id });
    this.loadOrigins();
    this.reload();
  },

  onSortTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.sort) return;
    this.setData({ sort: key });
    this.reload();
  },

  // ---------- 筛选弹层 ----------
  openFilter() {
    this.setData({
      tempFilter: {
        priceRange: this.data.filter.priceRange,
        origins: this.data.filter.origins.slice(),
        inStock: this.data.filter.inStock
      },
      filterVisible: true
    });
  },

  closeFilter() {
    this.setData({ filterVisible: false });
  },

  onPriceTap(e) {
    const val = e.currentTarget.dataset.value;
    const cur = this.data.tempFilter.priceRange;
    this.setData({ 'tempFilter.priceRange': cur === val ? '' : val });
  },

  onOriginTap(e) {
    const val = e.currentTarget.dataset.value;
    const origins = this.data.tempFilter.origins.slice();
    const i = origins.indexOf(val);
    if (i > -1) origins.splice(i, 1);
    else origins.push(val);
    this.setData({ 'tempFilter.origins': origins });
  },

  onStockChange(e) {
    this.setData({ 'tempFilter.inStock': !!e.detail.value });
  },

  onResetFilter() {
    this.setData({ tempFilter: EMPTY_FILTER() });
  },

  onConfirmFilter() {
    this.setData({
      filter: {
        priceRange: this.data.tempFilter.priceRange,
        origins: this.data.tempFilter.origins.slice(),
        inStock: this.data.tempFilter.inStock
      },
      filterVisible: false
    });
    this.reload();
  },

  // 空态里的"清除筛选"
  onClearFilter() {
    this.setData({ filter: EMPTY_FILTER(), tempFilter: EMPTY_FILTER() });
    this.reload();
  },

  // ---------- 商品 ----------
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
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
