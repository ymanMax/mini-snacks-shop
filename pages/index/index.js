// pages/index/index.js —— 首页（优化 3：搜索栏 / 骨架屏 / 分页 / 角标 / 限时抢购）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { pad2 } = require('../../utils/format.js');

Page({
  data: {
    banners: [],
    seckill: { title: '', endTime: 0, goods: [] },
    countdown: '',
    themes: [],
    // 推荐商品分页
    list: [],
    current: 1,
    size: 10,
    total: 0,
    loading: false,
    noMore: false,
    // 购物车角标
    cartCount: 0
  },

  onLoad() {
    this.loadHomeData();
    this.loadGoods(1);
    // 订阅购物车数量变化（onUnload 取消）
    this.unsubscribeCart = getApp().onCartCountChange(count => {
      this.setData({ cartCount: count });
    });
  },

  onShow() {
    getApp().refreshCartBadge();
  },

  onUnload() {
    this.clearCountdown();
    if (this.unsubscribeCart) this.unsubscribeCart();
  },

  onPullDownRefresh() {
    this.loadHomeData();
    this.loadGoods(1).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore) return;
    this.loadGoods(this.data.current + 1);
  },

  // ---------- 数据加载 ----------
  loadHomeData() {
    api.getBanners().then(banners => this.setData({ banners })).catch(() => {});
    api.getThemes().then(themes => this.setData({ themes })).catch(() => {});
    api.getSeckill().then(seckill => {
      this.setData({ seckill: seckill || { title: '', endTime: 0, goods: [] } });
      this.startCountdown();
    }).catch(() => {});
  },

  loadGoods(page) {
    if (this.data.loading) return Promise.resolve();
    this.setData({ loading: true });
    return api.getGoodsList({ current: page, size: this.data.size })
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

  // ---------- 限时抢购倒计时 ----------
  startCountdown() {
    this.clearCountdown();
    this.tickCountdown();
    this.countdownTimer = setInterval(() => this.tickCountdown(), 1000);
  },

  tickCountdown() {
    const endTime = Number(this.data.seckill.endTime) || 0;
    if (!endTime) return;
    const diff = endTime - Date.now();
    if (diff <= 0) {
      this.setData({ countdown: '00:00:00' });
      this.clearCountdown();
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.setData({ countdown: pad2(h) + ':' + pad2(m) + ':' + pad2(s) });
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  // ---------- 交互 ----------
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' });
  },

  onBannerTap(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.link) return;
    if (item.linkType === 'tab') {
      wx.switchTab({ url: item.link });
    } else {
      wx.navigateTo({ url: item.link, fail: () => {} });
    }
  },

  onThemeTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/list/list?theme=' + id });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  // 加购（默认两个规格首项）
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

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  // 限时抢购场次页（优化 1）
  goSeckill() {
    wx.navigateTo({ url: '/pages/seckill/index' });
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
