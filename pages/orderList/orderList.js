// pages/orderList/orderList.js
const app = getApp();
const {
  getAllOrders,
  cancelOrder
} = require('../../api/api.js');

Page({
  data: {
    orders: [],
    filteredOrders: [],
    currentFilter: 'all'
  },

  onLoad() {
    this.loadOrders();
  },

  // 加载订单数据
  loadOrders() {
    getAllOrders(1, 20).then(res => {
      this.setData({
        orders: res,
        filteredOrders: res
      });
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

  // 筛选订单
  filterOrders(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentFilter: status
    });

    if (status === 'all') {
      this.setData({
        filteredOrders: this.data.orders
      });
    } else {
      const filtered = this.data.orders.filter(order => order.status === status);
      this.setData({
        filteredOrders: filtered
      });
    }
  },

  // 跳转到订单详情
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?order_id=${orderId}`
    });
  },

  // 付款
  payOrder(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    });
  },

  // 取消订单
  cancelOrder(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.orderId;

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
            that.loadOrders();
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

  // 确认收货
  confirmReceipt(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.showToast({
      title: '确认收货功能开发中',
      icon: 'none'
    });
  }
})
