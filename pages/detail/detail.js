const {
  getDetail
} = require('../../api/api.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    num: 1,
    totalNum: 0,
    hasCarts: false,
    curIndex: 0,
    show: false,
    scaleCart: false,
    item: [],
    isClick: true,
    // 评价相关数据
    userRating: 0,
    userComment: '',
    displayReviews: [], // 用于显示的评价（默认显示前3条）
    showAllReviews: false, // 是否显示全部评价
    averageRating: 0, // 平均评分
    ratingDistribution: [] // 评分分布
  },
  addCount() {
    let num = this.data.num;
    num++;
    console.log("stock : ",this.data.item.stock);
    if (num < this.data.item.stock) {
      this.setData({
        num: num
      })
    }
  },
  unaddCount() {
    let num = this.data.num;
    num--;
    if (num > 0) {
      this.setData({
        num: num
      })
    }
  },
  bindTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      curIndex: index
    })
  },
  // 节流函数
  throttle() {
    if (this.data.isClick) {
      this.setData({
        isClick: false
      });
      setTimeout(() => {
        this.setData({
          isClick: true
        })
      }, 600);
    } else {
      return;
    }
  },
  addCart(e) {
    var goods = this.data.item;
    goods.isSelect = false;
    var count = this.data.num;
    var title = this.data.item.name;
    if (title.length > 10) {
      goods.title = title.substring(0, 10) + '...';
    }
    var arr = wx.getStorageSync('cart') || [];
    console.log("cart_arr,{} : ", arr);
    if (arr.length > 0) {
      for (var j in arr) {
        // 判断购物车内的item的id，和事件传递过来的id，是否相等  
        if (arr[j].id == this.data.item.id) {
          // 相等的话，给count+1（即再次添加入购物车，数量+1）  
          arr[j].count = arr[j].count + count;
          // 最后，把购物车数据，存放入缓存 
          try {
            wx.setStorageSync('cart', arr)
          } catch (e) {
            console.log(e)
          }
          return;
        }
      }
      arr.push(goods);
      arr[arr.length - 1].count = count;
    }else{
      arr.push(goods);
      arr[0].count = count;
    }
    try {
      wx.setStorageSync('cart', arr);      
    } catch (e) {      
        console.log(e)
    }
  },

  addToCart() {
    const self = this;
    const num = this.data.num;
    let total = this.data.totalNum;
    // 节流/////////////////
    this.throttle()
    // 动效////////////////////////////////////
    self.setData({
      show: true
    })
    setTimeout(function () {
      self.setData({
        show: false,
        scaleCart: true
      })
      setTimeout(function () {
        self.setData({
          scaleCart: false,
          hasCarts: true,
          totalNum: num + total
        })
      }, 200)
    }, 300)
    ///////////////////////////////////

    // 加购
    this.addCart();
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this;
    let product_id = options.product_id;
    getDetail(product_id).then(res => {
      console.log(res)
      that.setData({
        item: res
      })
      // 初始化评价数据
      that.initReviewData();
    })
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

  },

  // ==================== 评价相关方法 ====================

  /**
   * 初始化评价数据
   */
  initReviewData() {
    const { item } = this.data;

    if (item.reviews && item.reviews.length > 0) {
      // 计算平均评分
      const totalRating = item.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / item.reviews.length;

      // 计算评分分布
      const ratingDistribution = [0, 0, 0, 0, 0]; // 分别对应5星到1星的数量
      item.reviews.forEach(review => {
        ratingDistribution[5 - review.rating]++;
      });

      // 转换为百分比
      const distributionWithPercentage = ratingDistribution.map(count => ({
        count,
        percentage: (count / item.reviews.length) * 100
      }));

      // 设置初始显示的评价（前3条）
      const displayReviews = item.reviews.slice(0, 3);

      this.setData({
        averageRating: averageRating.toFixed(1),
        ratingDistribution: distributionWithPercentage,
        displayReviews
      });
    }
  },

  /**
   * 设置用户评分
   */
  setUserRating(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    this.setData({
      userRating: rating
    });
  },

  /**
   * 处理评价输入
   */
  onCommentInput(e) {
    this.setData({
      userComment: e.detail.value
    });
  },

  /**
   * 提交评价
   */
  submitReview() {
    const { userRating, userComment, item } = this.data;

    if (!userRating || !userComment.trim()) {
      wx.showToast({
        title: '请填写评分和评价内容',
        icon: 'none'
      });
      return;
    }

    // 创建新评价
    const newReview = {
      user_name: '匿名用户',
      rating: userRating,
      comment: userComment.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    // 更新评价数据
    let updatedReviews = item.reviews ? [...item.reviews, newReview] : [newReview];
    let updatedItem = { ...item, reviews: updatedReviews };

    // 更新页面数据
    this.setData({
      item: updatedItem,
      userRating: 0,
      userComment: ''
    });

    // 重新初始化评价数据
    this.initReviewData();

    wx.showToast({
      title: '评价提交成功',
      icon: 'success'
    });
  },

  /**
   * 查看全部评价
   */
  viewAllReviews() {
    const { item } = this.data;

    this.setData({
      displayReviews: item.reviews,
      showAllReviews: true
    });
  }
})