// pages/classic/classic.js —— 分类页：左侧 8 分类 + 右侧排序筛选分页
const app = getApp();
const { categoryApi, goodsApi, cartApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const PRICE_RANGES = [
  { label: '全部', min: '', max: '' },
  { label: '0-50', min: 0, max: 50 },
  { label: '50-100', min: 50, max: 100 },
  { label: '100-200', min: 100, max: 200 },
  { label: '200以上', min: 200, max: '' }
];

Page({
  data: {
    categories: [],
    activeId: 1,
    products: [],
    loading: true,
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden',
    sorts: [
      { key: 'default', label: '综合' },
      { key: 'sales', label: '销量' },
      { key: 'priceAsc', label: '价格' },
      { key: 'priceDesc', label: '价格' }
    ],
    sort: 'default',
    priceRanges: PRICE_RANGES,
    priceIndex: 0,
    origins: [],
    originOptions: [],
    selectedOrigins: [],
    inStock: false,
    showFilter: false,
    // 面板内临时选择
    tmpPriceIndex: 0,
    tmpOrigins: [],
    tmpInStock: false,
    cartCount: 0,
    scrollInto: ''
  },

  onLoad() {
    categoryApi.getCategories().then((list) => {
      this.setData({ categories: list });
    });
    this.loadProducts(true);
    this._onCart = (p) => this.setData({ cartCount: p.count });
    app.on('cartChange', this._onCart);
    this.setData({ cartCount: app.globalData.cartCount || 0 });
  },

  onUnload() {
    app.off('cartChange', this._onCart);
  },

  onShow() {
    app.updateCartBadge();
  },

  // 切换分类
  switchCategory(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (id === this.data.activeId) return;
    this.setData({
      activeId: id,
      sort: 'default',
      priceIndex: 0,
      selectedOrigins: [],
      inStock: false
    });
    this.loadProducts(true);
  },

  // 排序
  switchSort(e) {
    const key = e.currentTarget.dataset.key;
    let next = key;
    if (key === 'priceAsc' && this.data.sort === 'priceAsc') next = 'priceDesc';
    if (key === 'priceDesc' && this.data.sort === 'priceDesc') next = 'priceAsc';
    if (this.data.sort === next && key !== 'priceAsc' && key !== 'priceDesc') return;
    this.setData({ sort: next });
    this.loadProducts(true);
  },

  // 加载商品
  loadProducts(reset) {
    if (this.data.loadStatus === 'loading') return Promise.resolve();
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading', loading: reset });
    const params = {
      current: page,
      size: this.data.size,
      categoryId: this.data.activeId,
      sort: this.data.sort,
      inStock: this.data.inStock ? 1 : ''
    };
    const range = PRICE_RANGES[this.data.priceIndex];
    if (range.min !== '') params.minPrice = range.min;
    if (range.max !== '') params.maxPrice = range.max;
    if (this.data.selectedOrigins.length) params.origins = this.data.selectedOrigins.join(',');

    return goodsApi.getPage(params).then((res) => {
      const list = reset ? res.records : this.data.products.concat(res.records);
      const hasMore = list.length < res.total;
      const patch = {
        products: list,
        total: res.total,
        page: page + 1,
        loading: false,
        loadStatus: hasMore ? 'hidden' : (list.length ? 'nomore' : 'hidden')
      };
      if (!this.data.origins.length) {
        patch.origins = res.origins;
        patch.originOptions = res.origins.map((o) => ({ origin: o, checked: false }));
      }
      this.setData(patch);
    }).catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  onScrollLower() {
    if (this.data.products.length < this.data.total && this.data.loadStatus !== 'loading') {
      this.loadProducts(false);
    }
  },

  // ---- 筛选面板 ----
  openFilter() {
    const selected = this.data.selectedOrigins;
    this.setData({
      showFilter: true,
      tmpPriceIndex: this.data.priceIndex,
      tmpOrigins: selected.slice(),
      tmpInStock: this.data.inStock,
      originOptions: this.data.origins.map((o) => ({ origin: o, checked: selected.indexOf(o) !== -1 }))
    });
  },
  closeFilter() {
    this.setData({ showFilter: false });
  },
  noop() {},
  pickPrice(e) {
    this.setData({ tmpPriceIndex: Number(e.currentTarget.dataset.index) });
  },
  toggleOrigin(e) {
    const o = e.currentTarget.dataset.origin;
    const list = this.data.tmpOrigins.slice();
    const i = list.indexOf(o);
    if (i === -1) list.push(o); else list.splice(i, 1);
    this.setData({
      tmpOrigins: list,
      originOptions: this.data.origins.map((x) => ({ origin: x, checked: list.indexOf(x) !== -1 }))
    });
  },
  toggleInStock() {
    this.setData({ tmpInStock: !this.data.tmpInStock });
  },
  resetFilter() {
    this.setData({
      tmpPriceIndex: 0,
      tmpOrigins: [],
      tmpInStock: false,
      originOptions: this.data.origins.map((o) => ({ origin: o, checked: false }))
    });
  },
  applyFilter() {
    this.setData({
      showFilter: false,
      priceIndex: this.data.tmpPriceIndex,
      selectedOrigins: this.data.tmpOrigins,
      inStock: this.data.tmpInStock
    });
    this.loadProducts(true);
  },
  clearFilter() {
    this.setData({
      priceIndex: 0, selectedOrigins: [], inStock: false, sort: 'default',
      tmpPriceIndex: 0, tmpOrigins: [], tmpInStock: false
    });
    this.loadProducts(true);
  },

  onAddCart(e) {
    const g = e.detail.goods;
    const taste = g.specs[1] && g.specs[1].values[0] ? g.specs[1].values[0].label : '原味';
    cartApi.add({ goodsId: g.id, count: 1, specText: '标准装 · ' + taste, price: g.price })
      .then(() => {
        toast.showSuccess('已加入购物车');
        app.updateCartBadge();
      })
      .catch(() => {});
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  }
});
