// pages/fail/fail.js —— 支付失败提示页（Mock 演示）
Page({
  data: {},
  toOrderList() {
    wx.redirectTo({ url: '/pages/order/list/list?status=1' })
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
