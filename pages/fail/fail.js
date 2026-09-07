// pages/fail/fail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  toOrderDetail() {
    wx.redirectTo({
      url: '/pages/order/list?status=0',
      fail: () => wx.navigateBack({ delta: 1 })
    });
  },
  // 图片兜底：加载失败回退本地默认图
  onImgError(e) {
    // fail 页使用本地 /image/cry.png，双保险回退默认图
    if (e && e.target) {
      this.setData({ imgFallback: '/static/images/default.png' });
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})