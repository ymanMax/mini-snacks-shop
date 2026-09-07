// pages/mine/mine.js — 个人中心（重构）
// 数据统一走 api/index.js；toast 走 utils/toast.js；登录态以 app.globalData.userInfo 为准
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const app = getApp();

const DEFAULT_AVATAR = '/static/images/avatar.png';

/** 菜单分组配置（icon 为 emoji，action 为特殊行为，url/tab 为跳转） */
const MENU_GROUPS = [
  {
    title: '会员权益',
    items: [
      { icon: '💎', text: '会员中心', url: '/pages/member/center/center' },
      { icon: '📅', text: '每日签到', url: '/pages/member/checkin/checkin', dotKey: 'checkinDot' },
      { icon: '🪙', text: '我的积分', url: '/pages/member/points/points' },
      { icon: '🎫', text: '领券中心', url: '/pages/coupon/coupon?tab=available' },
      { icon: '🎟️', text: '我的优惠券', url: '/pages/coupon/coupon?tab=mine' }
    ]
  },
  {
    title: '我的服务',
    items: [
      { icon: '📍', text: '收货地址', url: '/pages/address/address' },
      { icon: '🛒', text: '购物车', tab: '/pages/cart/cart' },
      { icon: '❤️', text: '收藏记录', url: '/pages/collect/collect?type=collect' },
      { icon: '👣', text: '浏览足迹', url: '/pages/collect/collect?type=footprint' },
      { icon: '👥', text: '我的拼团', url: '/pages/group/group?tab=mine' },
      { icon: '🛠️', text: '售后服务', url: '/pages/service/tickets' }
    ]
  },
  {
    title: '店铺与配送',
    items: [
      { icon: '🏠', text: '店铺主页', url: '/pages/shop/shop' },
      { icon: '⭐', text: '店铺评价', url: '/pages/shop/shop?tab=reviews' },
      { icon: '🚚', text: '配送说明', url: '/pages/shop/shop?tab=delivery' }
    ]
  }
];

/** 客服会话已独立成页：/pages/service/chat（V1.1 优化4，原弹层模拟已下线） */
const SERVICE_URL = '/pages/service/chat';

Page({
  data: {
    isLogined: true,
    userInfo: null,
    avatar: DEFAULT_AVATAR,

    // 会员成长值进度
    member: null,

    // 订单角标 { s1, s2, s3, s4, review }
    statusCount: { s1: 0, s2: 0, s3: 0, s4: 0, review: 0 },
    unreadMessages: 0,

    // 菜单
    menuGroups: MENU_GROUPS,
    checkinDot: false, // 今日未签到显示红点
    settingOpen: false,

    // 弹层
    showAbout: false,
    version: 'V1.0'
  },

  onLoad() {
    // 登录态变化（退出/重新登录）监听
    this._userCb = (u) => {
      this.setData({
        isLogined: !!u,
        userInfo: u || null,
        avatar: (u && u.avatar) || DEFAULT_AVATAR
      });
    };
    app.on('userChange', this._userCb);
  },

  onShow() {
    const u = app.globalData.userInfo;
    this.setData({
      isLogined: !!u,
      userInfo: u || null,
      avatar: (u && u.avatar) || DEFAULT_AVATAR
    });
    this.refreshAll();
  },

  onUnload() {
    if (this._userCb) app.off('userChange', this._userCb);
  },

  onPullDownRefresh() {
    this.refreshAll().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh());
  },

  /** onShow 统一刷新：用户信息 + 订单角标 + 未读消息 + 会员进度 + 今日签到态（游客态零报错） */
  refreshAll() {
    return Promise.all([
      api.user.info().then((res) => {
        const u = res.data || null;
        if (u && app.globalData.userInfo) {
          // 登录态：同步最新用户信息；游客态（主动退出后）不自动重新登录
          app.setUserInfo(u);
          this.setData({
            isLogined: true,
            userInfo: u,
            avatar: u.avatar || DEFAULT_AVATAR,
            unreadMessages: u.unreadMessages || 0
          });
        }
      }).catch(() => {}),
      api.order.statusCount().then((res) => {
        this.setData({ statusCount: res.data || this.data.statusCount });
      }).catch(() => {}),
      api.message.unread().then((res) => {
        this.setData({ unreadMessages: (res.data && res.data.count) || 0 });
      }).catch(() => {}),
      api.member.info().then((res) => {
        this.setData({ member: res.data || null });
      }).catch(() => {}),
      api.checkin.info().then((res) => {
        this.setData({ checkinDot: !(res.data && res.data.todaySigned) });
      }).catch(() => {})
    ]);
  },

  /* ---------- 头部 ---------- */

  /** 未登录态：点击登录 → 注入完整 Mock 用户 */
  onLogin() {
    if (this.data.isLogined) return;
    toast.showLoading('登录中...');
    api.user.login().then((res) => {
      toast.hideLoading();
      const u = res.data;
      app.setUserInfo(u);
      this.setData({ isLogined: true, userInfo: u, avatar: u.avatar || DEFAULT_AVATAR });
      toast.showSuccess('登录成功');
      this.refreshAll();
    }).catch(() => toast.hideLoading());
  },

  /** 点击头像 → confirm → mock 换头像 */
  onChangeAvatar() {
    if (!this.data.isLogined) {
      this.onLogin();
      return;
    }
    toast.confirm('换个头像？').then((ok) => {
      if (!ok) return;
      toast.showLoading('更换中...');
      api.user.updateAvatar().then((res) => {
        toast.hideLoading();
        const avatar = (res.data && res.data.avatar) || DEFAULT_AVATAR;
        const u = Object.assign({}, this.data.userInfo, { avatar });
        app.setUserInfo(u);
        this.setData({ avatar, userInfo: u });
        toast.showSuccess('头像已更新');
      }).catch(() => toast.hideLoading());
    });
  },

  onGoMessage() {
    wx.navigateTo({ url: '/pages/message/message' });
  },

  onGoMember() {
    wx.navigateTo({ url: '/pages/member/center/center' });
  },

  onGoPoints() {
    wx.navigateTo({ url: '/pages/member/points/points' });
  },

  onGoCoupon() {
    wx.navigateTo({ url: '/pages/coupon/coupon?tab=mine' });
  },

  onGoCollect() {
    wx.navigateTo({ url: '/pages/collect/collect?type=collect' });
  },

  onGoOrderAll() {
    wx.navigateTo({ url: '/pages/order/list?status=0' });
  },

  /** 订单快捷入口：data-status 1/2/3/4/7 */
  onGoOrder(e) {
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({ url: '/pages/order/list?status=' + status });
  },

  /* ---------- 菜单 ---------- */

  /** 通用菜单跳转：data-url 普通跳转 / data-tab switchTab */
  onMenuTap(e) {
    const ds = e.currentTarget.dataset;
    if (ds.tab) {
      wx.switchTab({ url: ds.tab });
      return;
    }
    if (ds.url) {
      wx.navigateTo({ url: ds.url, fail: () => toast.showError('页面开发中，敬请期待') });
      return;
    }
    const action = ds.action;
    // 联系客服：V1.1 起改为跳转在线客服会话页（不再使用弹层模拟）
    if (action === 'service') this.goService();
    if (action === 'about') this.openAbout();
    if (action === 'setting') this.toggleSetting();
  },

  toggleSetting() {
    this.setData({ settingOpen: !this.data.settingOpen });
  },

  /* ---------- 在线客服（独立会话页） ---------- */

  goService() {
    wx.navigateTo({ url: SERVICE_URL, fail: () => toast.showError('页面开发中，敬请期待') });
  },

  /* ---------- 关于我们 ---------- */

  openAbout() {
    this.setData({ showAbout: true });
  },

  closeAbout() {
    this.setData({ showAbout: false });
  },

  /* ---------- 设置：清除缓存 / 退出登录 ---------- */

  onClearCache() {
    toast.confirm('将重置全部演示数据并清空本地缓存，确定继续？', '清除缓存').then((ok) => {
      if (!ok) return;
      toast.showLoading('重置中...');
      return api.debug.reset().then(() => {
        try { wx.clearStorageSync(); } catch (e) { /* ignore */ }
        // 重新注入 Mock 用户
        return api.user.login();
      }).then((res) => {
        toast.hideLoading();
        const u = res.data;
        app.setUserInfo(u);
        this.setData({ isLogined: true, userInfo: u, avatar: (u && u.avatar) || DEFAULT_AVATAR, settingOpen: false });
        if (app.refreshCartBadge) app.refreshCartBadge();
        toast.showSuccess('已重置演示数据');
        this.refreshAll();
      });
    }).catch(() => toast.hideLoading());
  },

  onLogout() {
    toast.confirm('确定退出登录吗？退出后仍可浏览商品', '退出登录').then((ok) => {
      if (!ok) return;
      app.logout();
      return api.user.logout().catch(() => {}).then(() => {
        this.setData({ isLogined: false, userInfo: null, avatar: DEFAULT_AVATAR, settingOpen: false });
        toast.showToast('已退出登录');
      });
    });
  },

  /* ---------- 图片兜底 ---------- */

  onImgError(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'avatar') this.setData({ avatar: '/static/images/default.png' });
  }
});
