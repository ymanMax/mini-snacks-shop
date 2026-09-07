/**
 * 拼团与团购批发 Mock 数据（字段与 4.12 groupBuy / 4.13 wholesale 对齐）
 * 拼团状态：1拼团中 / 2已成团 / 3未成团已退款
 */
const { fmt } = require('../_time.js');

const AV = (n) => '/static/mock/avatar-' + (((n - 1) % 6) + 1) + '.png';

const groupBuys = [
  {
    id: 1, goodsId: 10, name: '每日坚果混合装 30包', pic: '/static/mock/goods-10.png',
    groupPrice: 45.9, originalPrice: 59.9,
    requiredCount: 3, joinedCount: 2, status: 1,
    endTime: fmt(0.4, 'YYYY-MM-DD HH:mm'), endTimestamp: Date.now() + 0.4 * 86400000,
    members: [
      { avatar: AV(1), name: '坚果控***', isLeader: true },
      { avatar: AV(2), name: '爱吃***', isLeader: false }
    ],
    rules: ['3 人成团，团长享额外 95 折', '24 小时未成团自动退款', '每个账号同一团仅限参团 1 次']
  },
  {
    id: 2, goodsId: 23, name: '白桃气泡水 无糖0脂', pic: '/static/mock/goods-5.png',
    groupPrice: 2.5, originalPrice: 3.9,
    requiredCount: 2, joinedCount: 1, status: 1,
    endTime: fmt(0.6, 'YYYY-MM-DD HH:mm'), endTimestamp: Date.now() + 0.6 * 86400000,
    members: [{ avatar: AV(3), name: '气泡***', isLeader: true }],
    rules: ['2 人成团', '24 小时未成团自动退款']
  },
  {
    id: 3, goodsId: 27, name: '坚果零食大礼包 节日送礼', pic: '/static/mock/goods-9.png',
    groupPrice: 75.0, originalPrice: 88.0,
    requiredCount: 3, joinedCount: 3, status: 2,
    endTime: fmt(-0.2, 'YYYY-MM-DD HH:mm'), endTimestamp: Date.now() - 0.2 * 86400000,
    members: [
      { avatar: AV(4), name: '送礼***', isLeader: true },
      { avatar: AV(5), name: '小王***', isLeader: false },
      { avatar: AV(6), name: '阿May***', isLeader: false }
    ],
    rules: ['3 人成团', '24 小时未成团自动退款']
  },
  {
    id: 4, goodsId: 19, name: '靖江猪肉脯 原味蜜汁', pic: '/static/mock/goods-1.png',
    groupPrice: 15.9, originalPrice: 18.9,
    requiredCount: 2, joinedCount: 1, status: 1,
    endTime: fmt(0.9, 'YYYY-MM-DD HH:mm'), endTimestamp: Date.now() + 0.9 * 86400000,
    members: [{ avatar: AV(2), name: '肉脯***', isLeader: true }],
    rules: ['2 人成团', '24 小时未成团自动退款']
  }
];

/** 团购批发：买得越多单价越低 */
const wholesales = [
  {
    id: 1, goodsId: 1, title: '经典原味薯片 批发团购', pic: '/static/mock/goods-1.png',
    ladder: [{ count: 5, price: 6.2 }, { count: 10, price: 5.8 }, { count: 30, price: 5.2 }]
  },
  {
    id: 2, goodsId: 23, title: '白桃气泡水 整箱团购', pic: '/static/mock/goods-5.png',
    ladder: [{ count: 12, price: 3.5 }, { count: 24, price: 3.2 }, { count: 48, price: 2.9 }]
  },
  {
    id: 3, goodsId: 28, title: '零食巨型大礼包 企业团购', pic: '/static/mock/goods-10.png',
    ladder: [{ count: 5, price: 65.0 }, { count: 10, price: 62.0 }, { count: 20, price: 58.0 }]
  }
];

module.exports = { groupBuys, wholesales };
