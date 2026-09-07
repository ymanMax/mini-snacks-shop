// pages/orders/orders.js —— 旧订单详情页，统一重定向到新订单列表/详情
Page({
  onLoad(options) {
    const url = options.order_id || options.id
      ? '/pages/order/detail/detail?id=' + (options.id || options.order_id)
      : '/pages/order/list/list'
    wx.redirectTo({
      url: url,
      fail: () => wx.switchTab({ url: '/pages/mine/mine' })
    })
  }
})
