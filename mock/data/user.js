// mock/data/user.js —— Mock 用户
const defaultUser = {
  id: 10001,
  nickName: '零食爱好者',
  avatar: '/static/mock/avatar1.jpg',
  phone: '138****8888',
  level: 3, // 1普通/2银卡/3金卡/4铂金/5钻石
  points: 680,
  growthValue: 1250,
  birthday: '1998-08-08',
  gender: '保密',
  isGuest: false
};

// 可用于 mock 换头像的头像池
const avatarPool = [
  '/static/mock/avatar1.jpg',
  '/static/mock/avatar2.jpg',
  '/static/mock/avatar3.jpg',
  '/static/mock/avatar4.jpg',
  '/static/mock/avatar5.jpg',
  '/static/mock/avatar6.jpg'
];

module.exports = { defaultUser, avatarPool };
