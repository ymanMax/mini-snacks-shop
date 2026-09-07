// pages/orders/orders.js —— 旧版订单详情入口，兼容历史跳转：重定向到新版订单列表
Page({
  onLoad(options) {
    const url = options.order_id
      ? '/pages/order/detail/detail?id=' + options.order_id
      : '/pages/order/list/list';
    wx.redirectTo({
      url,
      fail: () => wx.switchTab({ url: '/pages/mine/mine' })
    });
  }
});
