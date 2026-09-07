// pages/group/index/index.js —— 拼团列表 / 我的拼团 / 一键开团
const app = getApp();
const { groupApi, goodsApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    tab: 'active',
    groups: [],
    mine: [],
    countdowns: {},
    hotGoods: []
  },

  onLoad(options) {
    if (options.tab === 'mine') this.setData({ tab: 'mine' });
    this.load();
    goodsApi.getPage({ current: 1, size: 6, sort: 'sales' }).then((res) => {
      this.setData({ hotGoods: res.records });
    });
  },

  onShow() {
    this.load();
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  load() {
    groupApi.getList().then((list) => {
      this.setData({ groups: list });
      this.startTick();
    });
    groupApi.getMine().then((list) => this.setData({ mine: list }));
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  startTick() {
    const tick = () => {
      const map = {};
      const now = Date.now();
      this.data.groups.forEach((g) => {
        const diff = Math.max(0, new Date(String(g.endTime).replace(/-/g, '/')).getTime() - now);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor(diff % 3600 / 60000);
        const s = Math.floor(diff % 60000 / 1000);
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        map[g.id] = pad(h) + ':' + pad(m) + ':' + pad(s);
      });
      this.setData({ countdowns: map });
    };
    tick();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(tick, 1000);
  },

  // 进入拼团详情（参团/邀请/成团都在详情页完成）
  goDetail(e) {
    wx.navigateTo({ url: '/pages/group/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  // 一键开团：选择热销商品
  openGroup() {
    const names = this.data.hotGoods.map((g) => g.name);
    wx.showActionSheet({
      itemList: names.slice(0, 6),
      success: (res) => {
        const g = this.data.hotGoods[res.tapIndex];
        wx.navigateTo({ url: '/pages/group/detail/detail?goodsId=' + g.id + '&open=1' });
      }
    });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' });
  }
});
