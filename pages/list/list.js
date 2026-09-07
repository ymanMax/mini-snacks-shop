// pages/list/list.js — 主题商品列表页（重构）
const api = require('../../api/index.js');

const DEFAULT_IMG = '/static/images/default.png';

Page({
  data: {
    themeId: null,
    themeName: '商品列表',
    theme: null,

    list: [],
    current: 0,
    size: 10,
    total: 0,
    hasMore: true,
    loading: false,
    firstLoading: true
  },

  onLoad(options) {
    const themeId = options && options.themeId ? Number(options.themeId) : null;
    let name = options && options.name ? decodeURIComponent(options.name) : '';
    this.setData({
      themeId,
      themeName: name || '商品列表'
    });
    wx.setNavigationBarTitle({ title: name || '商品列表' });

    if (themeId) this.loadTheme(themeId);
    this.loadList(true);
  },

  loadTheme(themeId) {
    api.home.themeDetail(themeId).then((res) => {
      const theme = res.data;
      if (!theme) return;
      this.setData({ theme });
      if (theme.name) {
        wx.setNavigationBarTitle({ title: theme.name });
      }
    }).catch(() => {});
  },

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
    const params = { current: target, size: this.data.size };
    if (this.data.themeId) params.themeId = this.data.themeId;
    api.goods.page(params).then((res) => {
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
    if (this.data.themeId) this.loadTheme(this.data.themeId);
    this.loadList(true, { stopRefresh: true });
  },

  onThemeImgError() {
    this.setData({ 'theme.topic_img': DEFAULT_IMG });
  }
});
