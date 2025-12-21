// pages/points/points.js
const app = getApp();
const {
  getUserPoints,
  getPointsExchangeProducts,
  exchangePoints
} = require('../../api/api.js');

Page({
  data: {
    userPoints: {},
    exchangeProducts: []
  },

  onLoad(options) {
    this.getUserPointsInfo();
    this.getExchangeProducts();
  },

  // 获取用户积分信息
  getUserPointsInfo() {
    getUserPoints().then(res => {
      this.setData({
        userPoints: res
      })
    })
  },

  // 获取积分兑换商品
  getExchangeProducts() {
    getPointsExchangeProducts().then(res => {
      this.setData({
        exchangeProducts: res
      })
    })
  },

  // 跳转到积分兑换页面
  goToExchange() {
    wx.showToast({
      title: '积分兑换功能开发中',
      icon: 'none'
    })
  },

  // 跳转到积分记录页面
  goToRecords() {
    wx.showToast({
      title: '积分记录功能开发中',
      icon: 'none'
    })
  },

  // 跳转到积分规则页面
  goToRules() {
    wx.showModal({
      title: '积分规则',
      content: '1. 购买商品：每消费1元获得1积分\n2. 评价商品：每次评价获得10积分\n3. 每日签到：每日签到获得5积分\n4. 积分抵扣：100积分=1元，最多抵扣订单金额的30%\n5. 积分有效期：自获得之日起12个月',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 兑换商品
  exchangeProduct(e) {
    const product = e.currentTarget.dataset.product;
    wx.showModal({
      title: '积分兑换',
      content: `确定使用 ${product.points_required} 积分兑换 ${product.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          exchangePoints(product.id).then(() => {
            wx.showToast({
              title: '兑换成功',
              icon: 'success'
            })
            // 更新积分信息
            this.getUserPointsInfo();
          })
        }
      }
    })
  }
})
