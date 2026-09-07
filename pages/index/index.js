// pages/index/index.js — 首页（重构）
// 数据统一走 api/index.js；toast 走 utils/toast.js；角标监听 app 事件总线
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const app = getApp();

const DEFAULT_IMG = '/static/images/default.png';

Page({
  data: {
    banners: [],
    themes: [],
    seckill: null,

    // 最近新品分页
    list: [],
    current: 0,
    size: 10,
    total: 0,
    hasMore: true,
    loading: false,
    firstLoading: true,

    cartCount: 0
  },

  onLoad() {
    this.loadBanners();
    this.loadThemes();
    this.loadSeckill();
    this.loadList(true);
  },

  onShow() {
    // 注册角标监听（onShow 注册、onHide 注销，避免重复绑定）
    this._cartCb = (count) => this.setData({ cartCount: count || 0 });
    app.on('cartChange', this._cartCb);
    this.setData({ cartCount: app.globalData.cartCount || 0 });
  },

  onHide() {
    this._unbindCart();
  },

  onUnload() {
    this._unbindCart();
  },

  _unbindCart() {
    if (this._cartCb) {
      app.off('cartChange', this._cartCb);
      this._cartCb = null;
    }
  },

  /* ---------- 数据加载 ---------- */
  loadBanners() {
    api.home.banners().then((res) => {
      this.setData({ banners: res.data || [] });
    }).catch(() => {});
  },

  loadThemes() {
    api.home.themes().then((res) => {
      this.setData({ themes: (res.data || []).slice(0, 3) });
    }).catch(() => {});
  },

  loadSeckill() {
    api.promotion.current().then((res) => {
      const arr = res.data || [];
      const sk = arr.filter((p) => p.type === 1)[0];
      if (sk && sk.goodsList && sk.goodsList.length) {
        this.setData({
          seckill: Object.assign({}, sk, { goodsList: sk.goodsList.slice(0, 6) })
        });
      }
    }).catch(() => {});
  },

  /**
   * 加载"最近新品"列表
   * @param {boolean} reset true=重置到第 1 页
   * @param {object} opts { stopRefresh }
   */
  loadList(reset, opts) {
    opts = opts || {};
    if (this.data.loading) {
      if (opts.stopRefresh) wx.stopPullDownRefresh();
      return;
    }
    if (!reset && !this.data.hasMore) {
      if (opts.stopRefresh) wx.stopPullDownRefresh();
      return;
    }
    const target = reset ? 1 : this.data.current + 1;
    this.setData({ loading: true });
    api.goods.page({ current: target, size: this.data.size, sort: 'comprehensive' }).then((res) => {
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
      if (opts.stopRefresh) wx.stopPullDownRefresh();
    }).catch(() => {
      this.setData({ loading: false, firstLoading: false });
      if (opts.stopRefresh) wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadList(false);
  },

  onPullDownRefresh() {
    this.loadBanners();
    this.loadThemes();
    this.loadSeckill();
    this.loadList(true, { stopRefresh: true });
  },

  /* ---------- 图片兜底 ---------- */
  onBannerImgError(e) {
    const i = e.currentTarget.dataset.index;
    this.setData({ ['banners[' + i + '].pic']: DEFAULT_IMG });
  },
  onThemeImgError(e) {
    const i = e.currentTarget.dataset.index;
    this.setData({ ['themes[' + i + '].topic_img']: DEFAULT_IMG });
  },
  onSeckillImgError(e) {
    const i = e.currentTarget.dataset.index;
    this.setData({ ['seckill.goodsList[' + i + '].pic']: DEFAULT_IMG });
  },

  /* ---------- 交互 ---------- */
  onThemeTap(e) {
    const ds = e.currentTarget.dataset;
    wx.navigateTo({
      url: '/pages/list/list?themeId=' + ds.id + '&name=' + encodeURIComponent(ds.name || '')
    });
  },

  onBannerTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onSeckillTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  /** 秒杀预告条"全部场次" → 秒杀场次页 */
  onSeckillAll() {
    wx.navigateTo({
      url: '/pages/promotion/seckill',
      fail: () => toast.showError('秒杀场次页暂未开放')
    });
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  // goods-card 加购成功回调（组件内部已刷新全局角标，此处仅兜底同步）
  onAdded() {
    this.setData({ cartCount: app.globalData.cartCount || 0 });
  }
});
