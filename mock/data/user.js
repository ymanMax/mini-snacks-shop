/**
 * Mock 用户（登录态）：app.js onLaunch 自动注入并 wx.setStorageSync('userInfo')
 * level 语义见 members.js：1普通 / 2银卡 / 3金卡 / 4铂金 / 5钻石
 */
const user = {
  id: 10001,
  nickName: '零食爱好者',
  avatar: '/static/images/avatar.png',
  phone: '138****8888',
  level: 3, // 金卡会员
  points: 680,
  growthValue: 1250,
  birthday: '1998-08-08',
  couponCount: 3,
  collectCount: 0,
  footprintCount: 0,
  isMember: true,
  memberExpire: '2027-08-08'
};

module.exports = { user };
