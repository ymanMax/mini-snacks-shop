// app.js
const cartApi = require('./api/cart.js')
const bus = require('./utils/bus.js')

// 与 mock/data/user.js 保持一致的默认登录用户（onLaunch 同步注入，保证页面零报错）
const DEFAULT_USER = {
  id: 10001,
  nickName: '零食爱好者',
  avatar: '/images/mine/avatar.png',
  phone: '138****8888',
  level: 2,
  points: 680,
  growthValue: 1250,
  birthday: '1998-08-08',
  gender: '保密',
  sign: '唯爱与零食不可辜负'
}

App({
  onLaunch() {
    // 自动注入 Mock 用户，游客也可体验全部功能
    const exist = wx.getStorageSync('userInfo')
    if (!exist || !exist.id) {
      wx.setStorageSync('userInfo', DEFAULT_USER)
    }
    // 冷启动时若 Mock 库停留在游客态，恢复为默认登录用户
    try {
      const db = require('./mock/db.js')
      db.init()
      if (db.state.isGuest) {
        db.state.isGuest = false
        db.save()
      }
    } catch (e) {}
    this.globalData.userInfo = wx.getStorageSync('userInfo')
    this.refreshCartBadge()
  },

  onShow() {
    this.refreshCartBadge()
  },

  globalData: {
    userInfo: null,
    cartCount: 0,
    // 首页分类导航跳 Tab 时携带的待选分类
    pendingCategory: null
  },

  // 刷新购物车 TabBar 角标与全局数量
  refreshCartBadge() {
    return cartApi.getCart().then((data) => {
      const count = data.totalCount || 0
      this.globalData.cartCount = count
      if (count > 0) {
        wx.setTabBarBadge({
          index: 2,
          text: count > 99 ? '99+' : String(count),
          fail() {}
        })
      } else {
        wx.removeTabBarBadge({ index: 2, fail() {} })
      }
      bus.emit(bus.EVENTS.CART_CHANGE, { count: count })
      return data
    }).catch(() => {})
  },

  // 跳分类 Tab 并指定分类
  switchCategory(categoryId) {
    this.globalData.pendingCategory = categoryId
    wx.switchTab({ url: '/pages/classic/classic' })
  }
})
