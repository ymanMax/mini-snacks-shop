// pages/member/center/center.js —— 会员卡 / 五级成长体系 / 生日礼包
const app = getApp();
const { memberApi } = require('../../../api/index.js');
const { growthRules } = require('../../../mock/data/members.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    member: null,
    growthRules,
    isBirthdayMonth: false,
    birthdayClaimed: false
  },

  onShow() {
    this.load();
  },

  load() {
    memberApi.getInfo().then((member) => {
      const month = new Date().getMonth() + 1;
      const birthMonth = Number(String(member.user.birthday).slice(5, 7));
      this.setData({
        member,
        isBirthdayMonth: month === birthMonth
      });
    });
  },

  claimBirthday() {
    if (!this.data.isBirthdayMonth) {
      toast.showToast('生日礼包仅在生日月可领取');
      return;
    }
    memberApi.birthdayGift().then((res) => {
      toast.showSuccess(`领取成功：${res.points} 积分 + ${res.coupon}`);
      this.setData({ birthdayClaimed: true });
      this.load();
    }).catch(() => {});
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/member/checkin/checkin' });
  },
  goPoints() {
    wx.navigateTo({ url: '/pages/member/points/points' });
  },
  goCoupon() {
    wx.navigateTo({ url: '/pages/coupon/center/center' });
  }
});
