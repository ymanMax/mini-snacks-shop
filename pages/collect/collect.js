// pages/collect/collect.js — 我的收藏 / 浏览足迹（type 区分）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    type: 'collect', // collect | footprint
    firstLoading: true,

    // 收藏分页
    list: [],
    current: 0,
    size: 10,
    total: 0,
    hasMore: true,
    loading: false,

    // 足迹分组
    groups: []
  },

  onLoad(options) {
    const type = options && options.type === 'footprint' ? 'footprint' : 'collect';
    this._inited = false;
    this.setData({ type });
    wx.setNavigationBarTitle({ title: type === 'footprint' ? '浏览足迹' : '我的收藏' });
    if (type === 'footprint') this.loadFootprint();
    else this.loadList(true);
  },

  onShow() {
    // 首次由 onLoad 加载；从详情页返回时静默刷新（收藏态可能已变）
    if (this._inited) {
      if (this.data.type === 'footprint') this.loadFootprint({ silent: true });
      else this.loadList(true, { silent: true });
    }
    this._inited = true;
  },

  onReachBottom() {
    if (this.data.type === 'collect') this.loadList(false);
  },

  onPullDownRefresh() {
    if (this.data.type === 'footprint') this.loadFootprint({ silent: true, stopRefresh: true });
    else this.loadList(true, { silent: true, stopRefresh: true });
  },

  /* ---------- 收藏 ---------- */
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
    if (!opts.silent) this.setData({ firstLoading: true });
    api.collect.page({ current: target, size: this.data.size }).then((res) => {
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

  onCancelCollect(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    toast.confirm('确定取消收藏该商品吗？').then((ok) => {
      if (!ok) return;
      api.collect.toggle(id).then(() => {
        const list = this.data.list.filter((g) => g.id !== id);
        this.setData({
          list,
          total: Math.max(0, this.data.total - 1)
        });
        toast.showToast('已取消收藏');
      }).catch(() => {});
    });
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /* ---------- 足迹 ---------- */
  loadFootprint(opts) {
    opts = opts || {};
    if (!opts.silent) this.setData({ firstLoading: true });
    api.collect.footprintList().then((res) => {
      this.setData({ groups: res.data || [], firstLoading: false });
      if (opts.stopRefresh) wx.stopPullDownRefresh();
    }).catch(() => {
      this.setData({ firstLoading: false });
      if (opts.stopRefresh) wx.stopPullDownRefresh();
    });
  },

  onClearFootprint() {
    toast.confirm('确定清空全部浏览足迹吗？').then((ok) => {
      if (!ok) return;
      api.collect.footprintClear().then(() => {
        this.setData({ groups: [] });
        toast.showToast('已清空浏览足迹');
      }).catch(() => {});
    });
  }
});
