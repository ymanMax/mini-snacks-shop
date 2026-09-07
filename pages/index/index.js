// pages/index/index.js —— 首页：搜索栏 / 轮播 / 金刚区 / 主题 / 分页新品 / 悬浮购物车
const app = getApp();
const { homeApi, goodsApi, cartApi, promotionApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    banners: [],
    entries: [],
    themes: [],
    seckill: null,
    countdown: '',
    products: [],
    loading: true,
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden', // loading | nomore | hidden
    cartCount: 0,
    current: 0
  },

  onLoad() {
    this.timer = null;
    this.loadBase();
    this.loadProducts(true);
  },

  onShow() {
    app.updateCartBadge();
    this.setData({ cartCount: app.globalData.cartCount || 0 });
    if (!this._busBound) {
      this._onCart = (p) => this.setData({ cartCount: p.count });
      app.on('cartChange', this._onCart);
      this._busBound = true;
    }
  },

  onUnload() {
    if (this._busBound) app.off('cartChange', this._onCart);
    if (this.timer) clearInterval(this.timer);
  },

  // 首屏基础数据
  loadBase() {
    homeApi.getBanners().then((list) => this.setData({ banners: list })).catch(() => {});
    homeApi.getQuickEntries().then((list) => this.setData({ entries: list })).catch(() => {});
    homeApi.getThemes().then((list) => this.setData({ themes: list })).catch(() => {});
    promotionApi.getAll().then((data) => {
      const seckill = (data.sessions || []).find((s) => s.status === 1) || data.sessions[0];
      this.setData({ seckill });
      if (seckill) this.startCountdown(seckill.endTime);
    }).catch(() => {});
  },

  startCountdown(endTime) {
    const tick = () => {
      const diff = new Date(String(endTime).replace(/-/g, '/')).getTime() - Date.now();
      if (diff <= 0) { this.setData({ countdown: '00:00:00' }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor(diff % 3600000 / 60000);
      const s = Math.floor(diff % 60000 / 1000);
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      this.setData({ countdown: pad(h) + ':' + pad(m) + ':' + pad(s) });
    };
    tick();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(tick, 1000);
  },

  // 商品分页
  loadProducts(reset) {
    if (this.data.loadStatus === 'loading') return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading' });
    goodsApi.getPage({ current: page, size: this.data.size, sort: 'default' })
      .then((res) => {
        const list = reset ? res.records : this.data.products.concat(res.records);
        const hasMore = list.length < res.total;
        this.setData({
          products: list,
          total: res.total,
          page: page + 1,
          loading: false,
          loadStatus: hasMore ? 'hidden' : (list.length ? 'nomore' : 'hidden')
        });
      })
      .catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  onReachBottom() {
    if (this.data.products.length < this.data.total && this.data.loadStatus !== 'loading') {
      this.loadProducts(false);
    }
  },

  onPullDownRefresh() {
    Promise.all([
      homeApi.getBanners().then((list) => this.setData({ banners: list })).catch(() => {}),
      this.loadProducts(true)
    ]).then(() => wx.stopPullDownRefresh());
    setTimeout(() => wx.stopPullDownRefresh(), 1500);
  },

  swiperChange(e) {
    this.setData({ current: e.detail.current });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/index/index' });
  },

  goTheme(e) {
    wx.navigateTo({ url: '/pages/list/list?item=' + e.currentTarget.dataset.id });
  },

  onEntry(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    if (url.indexOf('/pages/classic') === 0 || url.indexOf('/pages/cart') === 0) {
      wx.switchTab({ url: url.split('?')[0] });
    } else {
      wx.navigateTo({ url });
    }
  },

  goPromotion() {
    wx.navigateTo({ url: '/pages/promotion/index/index' });
  },

  // 列表快捷加购（默认规格）
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
