// mock/data/messages.js —— 消息通知
const { offsetTime } = require('../util');

// type：1系统 / 2订单 / 3促销 / 4互动
const messages = [
  {
    id: 6001,
    type: 2,
    title: '订单配送中',
    content: '您的订单已由骑手取货，预计 30 分钟内送达，请保持电话畅通。',
    isRead: false,
    createTime: offsetTime(0, -1),
    relatedId: 20004
  },
  {
    id: 6002,
    type: 3,
    title: '限时抢购开始啦',
    content: '今日 10:00-22:00 限时抢购，6 款人气零食低至 6.6 折，先到先得！',
    isRead: false,
    createTime: offsetTime(0, -3),
    relatedId: 0
  },
  {
    id: 6003,
    type: 4,
    title: '评价有回复',
    content: '商家回复了您的评价：感谢支持，我们会继续努力，期待您再次光临～',
    isRead: true,
    createTime: offsetTime(-1),
    relatedId: 30001
  },
  {
    id: 6004,
    type: 1,
    title: '欢迎来到零食商城',
    content: '新人专享礼包已发放至「我的优惠券」，满 59 减 8，快去使用吧！',
    isRead: true,
    createTime: offsetTime(-3),
    relatedId: 0
  },
  {
    id: 6005,
    type: 2,
    title: '订单待支付提醒',
    content: '您有一笔订单尚未支付，请在 30 分钟内完成支付，逾期将自动取消。',
    isRead: false,
    createTime: offsetTime(0, 0, -20),
    relatedId: 20001
  }
];

module.exports = messages;
