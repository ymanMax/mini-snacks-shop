// pages/cart/cart.js
const {
  setOrder,
  verify
} = require('../../api/api.js');
const {
  login
} = require('../mine/mine.js')
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    carts: [], //数据
    iscart: false,
    hidden: null,
    isAllSelect: false,
    totalMoney: 0,
    order_id: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
    var arr = wx.getStorageSync('cart') || [];
    // console.log("缓存数据：", arr);
    if (arr.length > 0) {
      // 更新数据
      this.setData({
        carts: arr,
        iscart: true,
        hidden: false
      });
      // console.log("新缓存数据：", this.data.carts);
    } else {
      this.setData({
        iscart: false,
        hidden: true,
      });
      // console.info("缓存数据：啥也没有");
    }
  },

  //勾选事件处理函数
  switchSelect: function (e) {
    // 获取item项的id，和数组的下标值
    var Allprice = 0,
      i = 0;
    let id = e.target.dataset.id,
      index = parseInt(e.target.dataset.index);
    this.data.carts[index].isSelect = !this.data.carts[index].isSelect; //价钱统计
    if (this.data.carts[index].isSelect) {
      this.data.totalMoney = this.data.totalMoney + (this.data.carts[index].price * this.data.carts[index].count);
    } else {
      this.data.totalMoney = this.data.totalMoney - (this.data.carts[index].price * this.data.carts[index].count);
    }
    //是否全选判断
    for (i = 0; i < this.data.carts.length; i++) {
      Allprice = Allprice + (this.data.carts[index].price * this.data.carts[index].count);
      // console.log(this.data.carts[i].isSelect);
    }
    if (Allprice == this.data.totalMoney) {
      this.data.isAllSelect = true;
    } else {
      this.data.isAllSelect = false;
    }
    this.setData({
      carts: this.data.carts,
      totalMoney: this.data.totalMoney,
      isAllSelect: this.data.isAllSelect,
    })
  },

  allSelect: function (e) {
    //处理全选逻辑
    let i = 0;
    if (!this.data.isAllSelect) {
      this.data.totalMoney = 0;
      for (i = 0; i < this.data.carts.length; i++) {
        this.data.carts[i].isSelect = true;
        this.data.totalMoney = this.data.totalMoney + (this.data.carts[i].price * this.data.carts[i].count);
      }
    } else {
      for (i = 0; i < this.data.carts.length; i++) {
        this.data.carts[i].isSelect = false;
      }
      this.data.totalMoney = 0;
    }
    this.setData({
      carts: this.data.carts,
      isAllSelect: !this.data.isAllSelect,
      totalMoney: this.data.totalMoney,
    })
  },

  /* 减数 */
  delCount: function (e) {
    var index = e.target.dataset.index;
    // console.log("count--");
    var count = this.data.carts[index].count; // 商品总数量-1
    if (count > 1) {
      this.data.carts[index].count--;
    }
    // 将数值与状态写回
    this.setData({
      carts: this.data.carts
    });
    // console.log("carts:" + this.data.carts);
    this.priceCount();
  },
  /* 加数 */
  addCount: function (e) {
    var index = e.target.dataset.index;
    // console.log("count++");
    var count = this.data.carts[index].count; // 商品总数量+1
    if (count < 10) {
      this.data.carts[index].count++;
    }
    // 将数值与状态写回
    this.setData({
      carts: this.data.carts
    });
    // console.log("carts:" + this.data.carts);
    this.priceCount();
  },
  priceCount: function (e) {
    this.data.totalMoney = 0;
    for (var i = 0; i < this.data.carts.length; i++) {
      if (this.data.carts[i].isSelect == true) {
        this.data.totalMoney = this.data.totalMoney + (this.data.carts[i].price * this.data.carts[i].count);
      }

    }
    this.setData({
      totalMoney: this.data.totalMoney,
    })
  },
  /* 删除item */
  delGoods: function (e) {
    this.data.carts.splice(e.target.id.substring(3), 1); // 更新data数据对象
    if (this.data.carts.length > 0) {
      this.setData({
        carts: this.data.carts
      })
      wx.setStorageSync('cart', this.data.carts);
      this.priceCount();
    } else {
      this.setData({
        cart: this.data.carts,
        iscart: false,
        hidden: true,
      })
      wx.setStorageSync('cart', []);
    }
  },

  goBuy: function (e) {
    // 筛选选中的商品
    var selectedProducts = [];
    this.data.carts.forEach(item => {
      if (item.isSelect == true) {
        selectedProducts.push({
          product_id: item.id,
          count: item.count,
        });
      }
    });

    // 检查是否有选中的商品
    if (selectedProducts.length === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      });
      return;
    }

    console.log('选中的商品:', selectedProducts);

    const that = this;

    // 调用创建订单接口
    setOrder(selectedProducts).then(res => {
      console.log('订单创建成功:', res);

      // 清空购物车中已结算的商品
      let remainingCarts = that.data.carts.filter(item => !item.isSelect);

      // 更新购物车数据
      if (remainingCarts.length > 0) {
        that.setData({
          carts: remainingCarts
        });
        wx.setStorageSync('cart', remainingCarts);
        that.priceCount();
      } else {
        that.setData({
          carts: [],
          iscart: false,
          hidden: true,
        });
        wx.setStorageSync('cart', []);
      }

      // 跳转到订单详情页面
      wx.setStorageSync('order_id', res.order_id);
      wx.navigateTo({
        url: '/pages/orders/orders?order_id=' + res.order_id
      });

    }).catch(err => {
      console.error('订单创建失败:', err);
      wx.showToast({
        title: '订单创建失败',
        icon: 'none'
      });
    });
  },
})