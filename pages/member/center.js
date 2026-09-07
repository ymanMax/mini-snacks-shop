// pages/member/center.js —— 会员中心（模块 3.2）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    member: null,
    levels: [],
    growthPercent: 0,
    imgErr: false,
    birthMonth: 0,
    claiming: false
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
      api.getMemberLevels().then(levels => this.setData({ levels })).catch(() => {}),
      api.getUserInfo().then(u => {
        const birthMonth = u.birthday ? Number(String(u.birthday).split('-')[1]) : 0;
        this.setData({ birthMonth });
      }).catch(() => {})
    ]);
  },

  onImgError() {
    this.setData({ imgErr: true });
  },

  onClaimBirthday() {
    if (this.data.claiming) return;
    this.setData({ claiming: true });
    api.claimBirthdayGift().then(res => {
      toast.showToast('获得「' + res.coupon.name + '」与 ' + res.points + ' 积分', 'none', 3000);
      this.loadAll();
    }).catch(() => {}).then(() => {
      this.setData({ claiming: false });
    });
  }
});
