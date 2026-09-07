// pages/mine/mine.js —— 个人中心（优化 8 / 模块 3.1）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const ORDER_ENTRIES = [
  { icon: '💰', name: '待付款', status: 1 },
  { icon: '📦', name: '待发货', status: 2 },
  { icon: '🚚', name: '配送中', status: 3 },
  { icon: '📬', name: '待收货', status: 4 },
  { icon: '✍️', name: '待评价', status: 7 }
];

Page({
  data: {
    loading: true,
    member: null,
    growthPercent: 0,
    orderEntries: ORDER_ENTRIES,
    statusCount: {},
    todaySigned: true,
    unread: 0,
    imgErr: false,
    // 配送说明弹层
    showDelivery: false,
    deliveryText: []
  },

  onShow() {
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  loadAll() {
    return Promise.all([
      api.getMemberInfo().then(m => {
        const percent = m.nextLevelGrowth
          ? Math.min(100, Math.round((m.growthValue / m.nextLevelGrowth) * 100))
          : 100;
        this.setData({ member: m, growthPercent: percent, loading: false });
      }).catch(() => this.setData({ loading: false })),
      api.getOrderStatusCount().then(c => this.setData({ statusCount: c })).catch(() => {}),
      api.getCheckinInfo().then(info => this.setData({ todaySigned: info.todaySigned })).catch(() => {}),
      api.getUnreadCount().then(n => this.setData({ unread: n })).catch(() => {})
    ]);
  },

  onImgError() {
    this.setData({ imgErr: true });
  },

  // 点击头像 mock 换头像
  onChangeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: res => {
        const avatar = res.tempFilePaths[0];
        api.updateUserInfo({ avatar }).then(() => {
          toast.success('头像已更新');
          const app = getApp();
          if (app.globalData.userInfo) app.globalData.userInfo.avatar = avatar;
          this.loadAll();
        });
      },
      fail: () => {}
    });
  },

  // 演示登录入口
  onMockLogin() {
    getApp().mockLogin();
    toast.success('已登录演示账号');
    this.loadAll();
  },

  goOrder(e) {
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({ url: '/pages/order/list?status=' + status });
  },

  goPoints() {
    wx.navigateTo({ url: '/pages/member/points' });
  },

  goMyCoupon() {
    wx.navigateTo({ url: '/pages/coupon/center?tab=mine' });
  },

  // 菜单统一跳转
  onMenuTap(e) {
    const { url, action } = e.currentTarget.dataset;
    if (action === 'switchTab') {
      wx.switchTab({ url });
    } else if (action === 'delivery') {
      this.openDelivery();
    } else if (url) {
      wx.navigateTo({ url });
    }
  },

  // 配送说明弹层
  openDelivery() {
    api.getShopInfo().then(shop => {
      const r = shop.deliveryRule || {};
      this.setData({
        showDelivery: true,
        deliveryText: [
          '基础配送费 ' + r.baseFee + ' 元（含 ' + r.baseKm + ' 公里）',
          '超出 ' + r.baseKm + ' 公里后，每公里加收 ' + r.perKmFee + ' 元',
          '单笔订单满 ' + r.freeThreshold + ' 元免基础配送费',
          '营业时间：' + shop.businessHours + '，最快 45 分钟送达'
        ]
      });
    });
  },
  closeDelivery() {
    this.setData({ showDelivery: false });
  }
});
