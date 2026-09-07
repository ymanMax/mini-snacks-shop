// app.js —— 全局入口：Mock 用户注入 / 购物车角标 / 简易事件总线
const mockStore = require('./mock/store.js');
const { cartApi } = require('./api/index.js');
const { defaultUser } = require('./mock/data/user.js');

App({
  // ---- 简易事件总线（跨页面角标/收藏等联动）----
  busEvents: {},
  on(name, fn) {
    (this.busEvents[name] = this.busEvents[name] || []).push(fn);
  },
  off(name, fn) {
    const list = this.busEvents[name];
    if (!list) return;
    const i = list.indexOf(fn);
    if (i !== -1) list.splice(i, 1);
  },
  emit(name, payload) {
    (this.busEvents[name] || []).forEach((fn) => {
      try { fn(payload); } catch (e) { console.error('bus error', name, e); }
    });
  },

  onLaunch() {
    // 初始化内存数据库（首次启动播种，之后走 storage 持久化）
    mockStore.init();

    // 登录态：无用户信息则自动注入 Mock 用户，游客可体验全部功能
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      userInfo = Object.assign({}, defaultUser);
      wx.setStorageSync('userInfo', userInfo);
    }
    this.globalData.userInfo = userInfo;
    this.globalData.token = 'mock_token_10001';

    // 角标初始化（tabBar 尚未就绪时延迟一次）
    setTimeout(() => this.updateCartBadge(), 300);
  },

  onShow() {
    this.updateCartBadge();
  },

  // 获取当前用户（与内存库保持一致）
  getUser() {
    const u = mockStore.getUser();
    this.globalData.userInfo = u;
    wx.setStorageSync('userInfo', u);
    return u;
  },

  // 购物车角标：有效商品总数量，实时同步到 tabBar 与各页面
  updateCartBadge() {
    cartApi.getCart().then((list) => {
      const count = (list || [])
        .filter((it) => !it.invalid)
        .reduce((s, it) => s + (it.count || 0), 0);
      this.globalData.cartCount = count;
      if (count > 0) {
        wx.setTabBarBadge({
          index: 2,
          text: count > 99 ? '99+' : String(count),
          fail: () => {}
        });
      } else {
        wx.removeTabBarBadge({ index: 2, fail: () => {} });
      }
      this.emit('cartChange', { count, list });
    }).catch(() => {});
  },

  globalData: {
    userInfo: null,
    base_URL: 'https://hanmashanghu.qiaomai365.com/api/v1',
    token: '',
    cartCount: 0
  }
});
