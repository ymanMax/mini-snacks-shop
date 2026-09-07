// pages/mine/mine.js —— 个人中心：会员卡 / 订单角标 / 菜单分组
const app = getApp();
const { memberApi, orderApi, checkinApi, shopApi, messageApi } = require('../../api/index.js');
const mockStore = require('../../mock/store.js');
const { avatarPool } = require('../../mock/data/user.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    member: null,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, review: 0 },
    signedToday: false,
    unread: 0,
    shopRule: null,
    showDelivery: false
  },

  onShow() {
    this.refresh();
    app.updateCartBadge();
  },

  onPullDownRefresh() {
    this.refresh();
    setTimeout(() => wx.stopPullDownRefresh(), 800);
  },

  refresh() {
    memberApi.getInfo().then((member) => {
      this.setData({ member });
      app.globalData.userInfo = member.user;
      wx.setStorageSync('userInfo', member.user);
    });
    orderApi.getCounts().then((counts) => this.setData({ counts })).catch(() => {});
    checkinApi.getInfo().then((ci) => this.setData({ signedToday: ci.todaySigned })).catch(() => {});
    messageApi.getList().then((m) => this.setData({ unread: m.unreadCount })).catch(() => {});
    shopApi.getInfo().then((shop) => this.setData({ shopRule: shop.deliveryRule })).catch(() => {});
  },

  // 点击头像：换头像（mock）
  changeAvatar() {
    const cur = this.data.member.user.avatar;
    let idx = avatarPool.indexOf(cur);
    const next = avatarPool[(idx + 1) % avatarPool.length];
    memberApi.updateUser({ avatar: next }).then(() => {
      toast.showSuccess('头像已更换');
      this.refresh();
    });
  },

  // 订单入口
  goOrders(e) {
    const status = e.currentTarget.dataset.status || 0;
    wx.navigateTo({ url: '/pages/order/list/list?status=' + status });
  },

  // 菜单导航
  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    if (url.indexOf('/pages/cart') === 0) {
      wx.switchTab({ url: url.split('?')[0] });
      return;
    }
    if (url === 'delivery') { this.setData({ showDelivery: true }); return; }
    if (url === 'about') {
      wx.showModal({
        title: '关于零食商城',
        content: '零食商城·直营店 v1.0.0\n品牌直供 · 当季新货 · 坏果包赔\n本小程序为演示环境，不产生真实交易。',
        showCancel: false,
        confirmColor: '#b4282d'
      });
      return;
    }
    if (url === 'settings') { this.openSettings(); return; }
    wx.navigateTo({
      url,
      fail: () => toast.showToast('页面建设中')
    });
  },

  openSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存', '退出登录（回到游客模式）'],
      success: (res) => {
        if (res.tapIndex === 0) {
          mockStore.reset();
          toast.showSuccess('缓存已清除');
          this.refresh();
          app.updateCartBadge();
        } else if (res.tapIndex === 1) {
          memberApi.logout().then(() => {
            toast.showSuccess('已退出登录，正在以游客模式浏览');
            this.refresh();
            app.updateCartBadge();
          });
        }
      }
    });
  },

  closePop() {
    this.setData({ showDelivery: false });
  },
  noop() {},

  goMessage() {
    wx.navigateTo({ url: '/pages/message/index/index' });
  }
});
