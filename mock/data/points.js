// mock/data/points.js —— 积分记录与积分兑换专区
const { offsetTime } = require('../util');

// type：1购物 / 2签到 / 3评价 / 4兑换消耗 / 5生日赠送
const recordsSeed = [
  { type: 2, points: 50, desc: '连续签到第 7 天大奖', createTime: offsetTime(-1) },
  { type: 1, points: 128, desc: '订单 SN202608280007 购物奖励', createTime: offsetTime(-5) },
  { type: 3, points: 20, desc: '商品评价奖励积分', createTime: offsetTime(-5) },
  { type: 4, points: -100, desc: '积分兑换「满 59 减 8」优惠券', createTime: offsetTime(-8) },
  { type: 2, points: 10, desc: '每日签到奖励', createTime: offsetTime(-2) },
  { type: 2, points: 5, desc: '每日签到奖励', createTime: offsetTime(-3) },
  { type: 1, points: 99, desc: '订单 SN202608200006 购物奖励', createTime: offsetTime(-12) },
  { type: 5, points: 200, desc: '生日礼包赠送积分', createTime: offsetTime(-30) }
];

// 积分兑换专区
const exchangeItems = [
  { id: 1, name: '5 元无门槛券', points: 50, type: 'coupon', couponTemplateId: 5, pic: '/static/mock/u08.jpg', stock: 999 },
  { id: 2, name: '满 59 减 8 优惠券', points: 100, type: 'coupon', couponTemplateId: 1, pic: '/static/mock/u07.jpg', stock: 999 },
  { id: 3, name: '满 99 减 20 优惠券', points: 200, type: 'coupon', couponTemplateId: 2, pic: '/static/mock/u06.jpg', stock: 200 },
  { id: 4, name: '乐事薯片尝鲜装', points: 500, type: 'goods', goodsId: 1, pic: '/static/mock/g01.jpg', stock: 20 },
  { id: 5, name: '每日坚果 7 日装', points: 800, type: 'goods', goodsId: 9, pic: '/static/mock/g09.jpg', stock: 10 }
];

const pointsRules = [
  '购物可得积分：实付 1 元 = 1 积分，确认收货后到账',
  '每日签到：连续签到第 7 天可领 50 积分大奖',
  '商品评价：每条带图评价奖励 20 积分',
  '生日礼包：生日月可领取 200 积分 + 专属优惠券',
  '积分有效期 1 年，兑换后不可退回'
];

module.exports = { recordsSeed, exchangeItems, pointsRules };
