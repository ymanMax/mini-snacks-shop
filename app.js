// app.js
// 全局入口：注入 Mock 用户（游客免登录体验全部功能）、维护购物车角标
const { getCartCount, shareInvite } = require('./api/index.js');

// Mock 用户（需求 2.3）
const MOCK_USER = {
  id: 10001,
  nickName: '零食爱好者',
  avatar: '/static/mock/avatar.png',
  phone: '138****8888',
  level: 3, // 金卡
  levelName: '金卡会员',
  points: 680,
  growthValue: 1250,
  birthday: '1998-08-08'
};

App({
  onLaunch(options) {
    this.ensureLogin();
    this.refreshCartBadge();
    // 分享裂变：通过邀请链接（?inviteBy=用户id）进入，发放邀请优惠券（每链接仅一次）
    const inviteBy = options && options.query && options.query.inviteBy;
    if (inviteBy && !wx.getStorageSync('mock_invited_' + inviteBy)) {
      wx.setStorageSync('mock_invited_' + inviteBy, true);
      shareInvite(inviteBy).then(res => {
        setTimeout(() => {
          wx.showToast({ title: '邀请有礼：已获得优惠券', icon: 'none', duration: 2500 });
        }, 800);
      }).catch(() => {});
    }
  },

  // 检测登录态，无则自动注入 Mock 用户
  ensureLogin() {
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      userInfo = MOCK_USER;
      wx.setStorageSync('userInfo', userInfo);
    }
    this.globalData.userInfo = userInfo;
    return userInfo;
  },

  // 重新注入完整 Mock 用户（我的页面点击登录时调用）
  mockLogin() {
    wx.setStorageSync('userInfo', MOCK_USER);
    this.globalData.userInfo = MOCK_USER;
    return MOCK_USER;
  },

  // 退出登录 → 回到游客态（重新注入 Mock 用户，保证页面零报错）
  mockLogout() {
    wx.removeStorageSync('userInfo');
    return this.ensureLogin();
  },

  // 全局刷新购物车角标（首页/分类/详情/购物车加购后调用）
  refreshCartBadge() {
    getCartCount().then(count => {
      this.globalData.cartCount = count;
      if (count > 0) {
        wx.setTabBarBadge({ index: 2, text: String(count) }).catch(() => {});
      } else {
        wx.removeTabBarBadge({ index: 2 }).catch(() => {});
      }
      // 通知监听方（如首页悬浮购物车角标）
      this.globalData.cartListeners.forEach(cb => {
        try { cb(count); } catch (e) {}
      });
    }).catch(() => {});
  },

  // 订阅角标变化，返回取消订阅函数
  onCartCountChange(cb) {
    this.globalData.cartListeners.push(cb);
    cb(this.globalData.cartCount);
    return () => {
      const arr = this.globalData.cartListeners;
      const i = arr.indexOf(cb);
      if (i > -1) arr.splice(i, 1);
    };
  },

  globalData: {
    userInfo: null,
    cartCount: 0,
    cartListeners: [],
    base_URL: 'https://hanmashanghu.qiaomai365.com/api/v1',
    token: ''
  }
});
