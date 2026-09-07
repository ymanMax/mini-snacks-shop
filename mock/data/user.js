// mock/data/user.js —— Mock 用户（app.js onLaunch 自动注入）
const user = {
  id: 10001,
  nickName: '零食爱好者',
  avatar: '/images/mine/avatar.png',
  phone: '138****8888',
  level: 2, // 1普通 2银卡 3金卡 4铂金 5钻石
  points: 680,
  growthValue: 1250,
  birthday: '1998-08-08',
  gender: '保密',
  sign: '唯爱与零食不可辜负'
}

// 游客态
const guest = {
  id: 0,
  nickName: '游客',
  avatar: '/static/mock/avatar/av02.png',
  phone: '',
  level: 0,
  points: 0,
  growthValue: 0,
  birthday: '',
  gender: '保密',
  sign: ''
}

module.exports = { user: user, guest: guest }
