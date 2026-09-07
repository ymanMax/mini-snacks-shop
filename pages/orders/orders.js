// pages/orders/orders.js —— 旧订单详情页（兼容改造）
// 旧链接可能携带 order_id 或 id，统一重定向到新订单详情页
Page({
  onLoad(options) {
    const opts = options || {};
    const id = opts.id || opts.order_id;
    if (id) {
      wx.redirectTo({ url: '/pages/order/detail?id=' + id });
    } else {
      wx.redirectTo({ url: '/pages/order/list' });
    }
  }
});
