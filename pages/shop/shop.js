// pages/shop/shop.js — 店铺页（店铺主页 / 店铺评价 / 配送说明）
// 数据统一走 api/index.js；toast 走 utils/toast.js
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';

Page({
  data: {
    tab: 'home',            // home | reviews | delivery（onLoad options.tab 定位）
    shop: null,
    firstLoading: true,
    // 店铺主页：招牌推荐（销量前 6）
    goods: [],
    goodsLoaded: false,
    // 店铺评价分页
    summary: null,
    reviews: [],
    current: 0,
    size: 10,
    total: 0,
    hasMore: true,
    reviewLoading: false,
    reviewsLoaded: false
  },

  onLoad(options) {
    const t = options && options.tab;
    const tab = (t === 'reviews' || t === 'delivery') ? t : 'home';
    this.setData({ tab });
    this.loadShop();
  },

  /* ---------- 数据加载 ---------- */
  loadShop() {
    return api.shop.info().then((res) => {
      this.setData({ shop: res.data || null, firstLoading: false });
      this.loadTabData(this.data.tab);
    }).catch(() => this.setData({ firstLoading: false }));
  },

  loadTabData(tab) {
    if (tab === 'home' && !this.data.goodsLoaded) this.loadGoods();
    if (tab === 'reviews' && !this.data.reviewsLoaded) this.loadReviews(true);
  },

  /** 招牌推荐：销量排序前 6 */
  loadGoods() {
    api.goods.page({ current: 1, size: 6, sort: 'sales' }).then((res) => {
      this.setData({ goods: (res.data && res.data.records) || [], goodsLoaded: true });
    }).catch(() => this.setData({ goodsLoaded: true }));
  },

  /** 店铺评价分页（reset=true 重新加载第一页） */
  loadReviews(reset) {
    if (this.data.reviewLoading) return Promise.resolve();
    const current = reset ? 1 : this.data.current + 1;
    this.setData({ reviewLoading: true });
    return api.review.shopPage({ current, size: this.data.size }).then((res) => {
      const d = res.data || {};
      const records = d.records || [];
      const reviews = reset ? records : this.data.reviews.concat(records);
      this.setData({
        reviews,
        summary: d.summary || this.data.summary,
        current: d.current || current,
        total: d.total || 0,
        hasMore: reviews.length < (d.total || 0),
        reviewLoading: false,
        reviewsLoaded: true
      });
    }).catch(() => this.setData({ reviewLoading: false, reviewsLoaded: true }));
  },

  /* ---------- Tab 切换 / 分页 / 下拉刷新 ---------- */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab });
    this.loadTabData(tab);
  },

  onReachBottom() {
    if (this.data.tab === 'reviews' && this.data.hasMore) this.loadReviews(false);
  },

  onPullDownRefresh() {
    if (this.data.tab === 'home') this.setData({ goodsLoaded: false });
    if (this.data.tab === 'reviews') this.setData({ reviewsLoaded: false });
    this.loadShop().then(() => wx.stopPullDownRefresh());
  },

  /* ---------- 图片兜底 / 门店照片预览 ---------- */
  onImgError(e) {
    const path = e.currentTarget.dataset.path;
    if (path) this.setData({ [path]: DEFAULT_IMG });
  },

  onPreview(e) {
    const index = Number(e.currentTarget.dataset.index);
    const photos = (this.data.shop && this.data.shop.photos) || [];
    if (!photos.length) return;
    wx.previewImage({ current: photos[index], urls: photos });
  },

  /* ---------- 交互 ---------- */
  onNoticeTap() {
    const shop = this.data.shop;
    if (!shop) return;
    toast.alert(shop.notice, '店铺公告');
  },

  onAddressTap() {
    const shop = this.data.shop;
    if (!shop) return;
    toast.showToast('门店地址：' + shop.address);
  },

  onService() {
    const shop = this.data.shop || {};
    toast.alert('客服热线：' + (shop.phone || '400-800-8888') + '\n服务时间：' + (shop.businessHours || '08:00-22:00') + '（演示环境）\n\n也可前往「我的 → 联系客服」在线会话', '联系客服');
  },

  onGoShop() {
    wx.switchTab({ url: '/pages/index/index' });
  }
  // 说明：goods-card 组件内部加购成功后已自动调用 getApp().refreshCartBadge()，页面无需重复处理
});
