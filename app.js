// app.js
const { user: mockUser } = require('./mock/data/user.js');

App({
  onLaunch() {
    // ★ 登录态统一：自动注入 Mock 用户，保证依赖登录态的页面零报错（游客无需登录即可体验全部功能）
    let userInfo = null;
    try {
      userInfo = wx.getStorageSync('userInfo');
    } catch (e) { /* ignore */ }
    if (!userInfo) {
      userInfo = Object.assign({}, mockUser);
      try { wx.setStorageSync('userInfo', userInfo); } catch (e) { /* ignore */ }
    }
    this.globalData.userInfo = userInfo;

    // 兼容旧 token 逻辑（不再阻断任何页面）
    try {
      const token = wx.getStorageSync('token');
      if (token) this.globalData.token = token;
    } catch (e) { /* ignore */ }

    // 初始化购物车角标与未读消息
    this.refreshCartBadge();
    this.refreshUnreadMessage();
  },

  /* ---------- 简单事件总线：跨页面同步（角标 / 收藏态 / 订单状态） ---------- */
  on(event, cb) {
    (this._events[event] || (this._events[event] = [])).push(cb);
  },
  off(event, cb) {
    const list = this._events[event];
    if (!list) return;
    if (!cb) { delete this._events[event]; return; }
    const i = list.indexOf(cb);
    if (i > -1) list.splice(i, 1);
  },
  emit(event, data) {
    (this._events[event] || []).forEach((cb) => {
      try { cb(data); } catch (e) { console.error('[event]', event, e); }
    });
  },
  _events: {},

  /* ---------- 购物车角标全局同步 ---------- */
  /** 任意页面加购/删购后调用：刷新 tabBar 角标 + globalData + 广播 cartChange 事件 */
  refreshCartBadge() {
    const api = require('./api/index.js');
    return api.cart.count().then((res) => {
      const count = (res.data && res.data.count) || 0;
      this.globalData.cartCount = count;
      if (count > 0) {
        wx.setTabBarBadge({ index: 2, text: String(count > 99 ? '99+' : count), fail: () => {} });
      } else {
        wx.removeTabBarBadge({ index: 2, fail: () => {} });
      }
      this.emit('cartChange', count);
      return count;
    }).catch(() => 0);
  },

  /* ---------- 未读消息角标 ---------- */
  refreshUnreadMessage() {
    const api = require('./api/index.js');
    return api.message.unread().then((res) => {
      this.globalData.unreadMessages = (res.data && res.data.count) || 0;
      this.emit('messageChange', this.globalData.unreadMessages);
      return this.globalData.unreadMessages;
    }).catch(() => 0);
  },

  /* ---------- 用户信息 ---------- */
  getUserInfo() {
    if (!this.globalData.userInfo) {
      try { this.globalData.userInfo = wx.getStorageSync('userInfo') || null; } catch (e) { /* ignore */ }
    }
    return this.globalData.userInfo;
  },
  setUserInfo(u) {
    this.globalData.userInfo = u;
    try { wx.setStorageSync('userInfo', u); } catch (e) { /* ignore */ }
    this.emit('userChange', u);
  },
  /** 退出登录：回到游客态（保留浏览能力，Mock 数据不清除） */
  logout() {
    this.globalData.userInfo = null;
    try { wx.removeStorageSync('userInfo'); } catch (e) { /* ignore */ }
    this.emit('userChange', null);
  },

  globalData: {
    userInfo: null,
    token: '',
    cartCount: 0,
    unreadMessages: 0,
    // 主题规范（与 app.wxss / app.json 保持一致）
    theme: {
      primary: '#b4282d',
      priceColor: '#b4282d',
      pageBg: '#f5f6f7',
      cardRadius: '16rpx',
      gap: '24rpx'
    },
    base_URL: 'https://hanmashanghu.qiaomai365.com/api/v1'
  }
});
