// pages/setting/setting.js —— 设置
const toast = require('../../utils/toast.js');

Page({
  data: {
    version: 'V1.0'
  },

  onClearCache() {
    toast.confirm('清除后所有演示数据将恢复初始状态', '清除缓存').then(ok => {
      if (!ok) return;
      wx.clearStorageSync();
      // 清缓存后重新注入游客 Mock 用户，保证全局零报错
      getApp().ensureLogin();
      toast.showToast('已清除，重启小程序生效', 'none', 2500);
    });
  },

  onLogout() {
    toast.confirm('退出登录将回到游客态，仍可浏览全部演示内容', '退出登录').then(ok => {
      if (!ok) return;
      getApp().mockLogout();
      toast.showToast('已退回游客态');
    });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  }
});
