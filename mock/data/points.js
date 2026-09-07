/**
 * 积分记录 Mock 数据（字段与 4.8 pointsRecord 对齐）
 * type：1购物 / 2签到 / 3评价 / 4兑换消耗 / 5生日赠送
 */
const { fmt } = require('../_time.js');

const TYPE_TEXT = { 1: '购物奖励', 2: '签到奖励', 3: '评价奖励', 4: '积分兑换', 5: '生日赠送', 6: '分享奖励' };

const records = [
  { id: 1, type: 2, points: 5, desc: '每日签到', createTime: fmt(-1, 'YYYY-MM-DD 09:12') },
  { id: 2, type: 1, points: 59, desc: '订单 SN20260828001 购物奖励', createTime: fmt(-2, 'YYYY-MM-DD 20:31') },
  { id: 3, type: 2, points: 5, desc: '每日签到', createTime: fmt(-3, 'YYYY-MM-DD 08:57') },
  { id: 4, type: 3, points: 20, desc: '评价订单 SN20260820002', createTime: fmt(-5, 'YYYY-MM-DD 12:40') },
  { id: 5, type: 4, points: -100, desc: '兑换 10 元无门槛优惠券', createTime: fmt(-7, 'YYYY-MM-DD 15:22') },
  { id: 6, type: 2, points: 10, desc: '连续签到第 3 天', createTime: fmt(-9, 'YYYY-MM-DD 09:03') },
  { id: 7, type: 1, points: 129, desc: '订单 SN20260810003 购物奖励', createTime: fmt(-12, 'YYYY-MM-DD 21:15') },
  { id: 8, type: 5, points: 200, desc: '生日礼包积分赠送', createTime: fmt(-20, 'YYYY-MM-DD 10:00') },
  { id: 9, type: 3, points: 20, desc: '评价订单 SN20260725001', createTime: fmt(-25, 'YYYY-MM-DD 19:44') },
  { id: 10, type: 4, points: -300, desc: '兑换每日坚果试吃装', createTime: fmt(-30, 'YYYY-MM-DD 11:08') },
  { id: 11, type: 1, points: 45, desc: '订单 SN20260701002 购物奖励', createTime: fmt(-40, 'YYYY-MM-DD 18:26') },
  { id: 12, type: 2, points: 15, desc: '连续签到第 5 天', createTime: fmt(-45, 'YYYY-MM-DD 08:49') }
];

/** 积分商城兑换专区 */
const exchangeGoods = [
  { id: 1, name: '5元无门槛优惠券', pic: '/static/mock/goods-6.png', points: 100, stock: 99, type: 'coupon', desc: '全场通用，兑换后立即到账' },
  { id: 2, name: '10元满59优惠券', pic: '/static/mock/goods-9.png', points: 180, stock: 60, type: 'coupon', desc: '满 59 元可用' },
  { id: 3, name: '每日坚果试吃装', pic: '/static/mock/goods-10.png', points: 300, stock: 20, type: 'goods', desc: '3 包混合坚果试吃装' },
  { id: 4, name: '棒棒糖兑换券', pic: '/static/mock/goods-6.png', points: 150, stock: 35, type: 'goods', desc: '12 支装水果棒棒糖' },
  { id: 5, name: '气泡水 6 连包', pic: '/static/mock/goods-5.png', points: 400, stock: 15, type: 'goods', desc: '白桃味气泡水 6 瓶' },
  { id: 6, name: '50元大额券', pic: '/static/mock/goods-11.png', points: 800, stock: 10, type: 'coupon', desc: '满 199 元可用' }
];

/** 积分规则说明 */
const rules = [
  '1. 购物：订单完成后按实付金额 1 元 = 1 积分发放；',
  '2. 签到：每日签到 +5 分，连签第 3/4/5/6/7 天额外 +10/+10/+15/+20/+50；',
  '3. 评价：完成订单评价 +20 分，带图评价 +30 分；',
  '4. 兑换：积分可在积分商城兑换优惠券与实物商品；',
  '5. 有效期：积分自获得之日起 12 个月内有效，过期自动清零；',
  '6. 演示环境说明：本项目为 Mock 演示，不产生真实交易。'
];

module.exports = { records, exchangeGoods, rules, TYPE_TEXT };
