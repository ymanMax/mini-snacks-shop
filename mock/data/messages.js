// mock/data/messages.js —— 消息通知（link 决定点击跳转）
// type: 1系统 2订单 3促销 4互动
const { daysAgo, hoursAgo, fmt } = require('../util.js')

const messages = [
  {
    id: 1,
    type: 1,
    title: '欢迎来到零食商城',
    content: '新人专享 5 元无门槛券已放入卡包，下单即可使用，祝您购物愉快！',
    isRead: true,
    createTime: fmt(daysAgo(7, 10, 0)),
    link: { type: 'coupon', id: '' }
  },
  {
    id: 2,
    type: 2,
    title: '订单配送提醒',
    content: '您的订单骑手已取货，正在飞奔配送中，预计 20 分钟送达，请保持电话畅通。',
    isRead: false,
    createTime: fmt(hoursAgo(1)),
    link: { type: 'order', id: 30007 }
  },
  {
    id: 3,
    type: 3,
    title: '限时抢购开抢啦',
    content: '每日 10/14/20 点准时开抢，人气薯片低至 6.8 折，数量有限先到先得！',
    isRead: false,
    createTime: fmt(hoursAgo(5)),
    link: { type: 'seckill', id: '' }
  },
  {
    id: 4,
    type: 4,
    title: '评价有奖励',
    content: '您有订单已送达，晒图评价可获 20 积分奖励，快来分享您的美味体验吧～',
    isRead: false,
    createTime: fmt(daysAgo(1, 18, 30)),
    link: { type: 'order', id: 30004 }
  },
  {
    id: 5,
    type: 1,
    title: '会员升级通知',
    content: '恭喜您成长值达到 1000，已升级为银卡会员，解锁 97 折会员价与生日礼包。',
    isRead: true,
    createTime: fmt(daysAgo(3, 9, 15)),
    link: { type: 'member', id: '' }
  },
  {
    id: 6,
    type: 3,
    title: '优惠券即将过期',
    content: '您有 1 张 5 元无门槛券将于 9 天后过期，快去使用吧！',
    isRead: true,
    createTime: fmt(daysAgo(2, 12, 0)),
    link: { type: 'coupon', id: '' }
  },
  {
    id: 7,
    type: 3,
    title: '拼团活动进行中',
    content: '3 人成团立享 8.2 折，邀请好友参团更有机会获得优惠券奖励！',
    isRead: false,
    createTime: fmt(hoursAgo(8)),
    link: { type: 'groupList', id: '' }
  }
]

module.exports = messages
