// pages/member/center/center.js — 会员中心
// 数据统一走 api/index.js；toast 走 utils/toast.js
const api = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    member: null,      // api.member.info()
    levels: [],        // api.member.levels() → levels（5级配置）
    currentLevel: 0,
    userInfo: null,

    // 升级文案
    upgradeText: '',
    remainGrowth: 0,
    isMaxLevel: false,

    firstLoading: true
  },

  onLoad() {
    this.loadAll();
  },

  onShow() {
    // 从签到页/积分页返回时同步成长值与积分
    if (!this.data.firstLoading) this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh());
  },

  loadAll() {
    return Promise.all([
      api.member.info().then((res) => {
        const m = res.data || {};
        const isMaxLevel = m.level >= 5;
        const remainGrowth = Math.max(0, (m.nextLevelGrowth || 0) - (m.growthValue || 0));
        this.setData({ member: m, isMaxLevel, remainGrowth });
        this._buildUpgradeText();
      }).catch(() => {}),
      api.member.levels().then((res) => {
        const d = res.data || {};
        this.setData({
          levels: d.levels || [],
          currentLevel: d.currentLevel || 0
        });
        this._buildUpgradeText();
      }).catch(() => {}),
      api.user.info().then((res) => {
        this.setData({ userInfo: res.data || null });
      }).catch(() => {})
    ]).then(() => {
      this.setData({ firstLoading: false });
    }).catch(() => {
      this.setData({ firstLoading: false });
    });
  },

  /** 升级文案：再获 xx 成长值升级 铂金会员 / 已是最高等级 */
  _buildUpgradeText() {
    const m = this.data.member;
    if (!m) return;
    if (m.level >= 5) {
      this.setData({ upgradeText: '已是最高等级', isMaxLevel: true });
      return;
    }
    const levels = this.data.levels;
    const next = levels.find((l) => l.level === m.level + 1);
    const nextName = next ? next.levelName : '下一等级';
    const remain = Math.max(0, (m.nextLevelGrowth || 0) - (m.growthValue || 0));
    this.setData({
      remainGrowth: remain,
      upgradeText: '再获 ' + remain + ' 成长值升级 ' + nextName
    });
  },

  /** 领取生日礼包 */
  onReceiveBirthday() {
    const b = this.data.member && this.data.member.birthday;
    if (!b || !b.isBirthdayMonth || b.received) return;
    toast.showLoading('领取中...');
    api.member.receiveBirthday().then((res) => {
      toast.hideLoading();
      toast.showSuccess((res.data && res.data.msg) || '生日礼包领取成功');
      this.loadAll();
    }).catch(() => toast.hideLoading());
  },

  onGoCheckin() {
    wx.navigateTo({ url: '/pages/member/checkin/checkin' });
  },

  onGoPoints() {
    wx.navigateTo({ url: '/pages/member/points/points' });
  },

  onImgError(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'avatar' && this.data.userInfo) {
      this.setData({ 'userInfo.avatar': '/static/images/default.png' });
    }
  }
});
