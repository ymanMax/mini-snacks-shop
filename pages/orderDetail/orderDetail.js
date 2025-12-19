// pages/orderDetail/orderDetail.js
const app = getApp();
const {
  getOrderDetail,
  cancelOrder,
  editOrder
} = require('../../api/api.js');

Page({
  data: {
    order: {},
    address: {}
  },

  onLoad(options) {
    const orderId = options.order_id;
    this.loadOrderDetail(orderId);
    this.loadAddress();
  },

  // 加载订单详情
  loadOrderDetail(orderId) {
    getOrderDetail(orderId).then(res => {
      this.setData({
        order: res
      });
    });
  },

  // 加载地址信息
  loadAddress() {
    const address = wx.getStorageSync('address') || {};
    this.setData({
      address: address
    });
  },

  // 获取订单状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '未付款',
      completed: '已完成',
      cancelled: '已取消',
      shipped: '已发货',
      processing: '处理中'
    };
    return statusMap[status] || status;
  },

  // 付款
  payOrder() {
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    });
  },

  // 取消订单
  cancelOrder() {
    const that = this;
    const orderId = this.data.order.order_id;

    wx.showModal({
      title: '确认取消',
      content: '您确定要取消该订单吗？',
      success: function (res) {
        if (res.confirm) {
          cancelOrder(orderId).then(res => {
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            });
            // 更新订单详情
            that.loadOrderDetail(orderId);
            // 发送订单状态变化通知
            that.sendOrderStatusNotification(orderId, 'cancelled');
          }).catch(() => {
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 编辑订单
  editOrder() {
    const orderId = this.data.order.order_id;
    wx.showModal({
      title: '编辑订单',
      content: '编辑订单功能开发中，是否继续？',
      success: function (res) {
        if (res.confirm) {
          editOrder(orderId, { status: 'processing' }).then(res => {
            wx.showToast({
              title: '订单已更新',
              icon: 'success'
            });
          }).catch(() => {
            wx.showToast({
              title: '编辑失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 确认收货
  confirmReceipt() {
    wx.showToast({
      title: '确认收货功能开发中',
      icon: 'none'
    });
  },

  // 发送订单状态变化通知
  sendOrderStatusNotification(orderId, newStatus) {
    wx.showToast({
      title: `订单状态已更新为${this.getStatusText(newStatus)}`,
      icon: 'success',
      duration: 2000
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
})
