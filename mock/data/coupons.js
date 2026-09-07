/**
 * 优惠券 Mock 数据（字段与 4.10 coupon 对齐）
 * type：1满减 / 2折扣 / 3无门槛；status：1未使用 / 2已使用 / 3已过期
 * discount：满减/无门槛券为减免金额（元）；折扣券 88 表示 8.8 折
 */
const { fmt } = require('../_time.js');

/** 可领取的券模板 */
const templates = [
  { id: 101, name: '满59减10', type: 1, threshold: 59, discount: 10, scope: '全场通用', expireDays: 15, source: '领取', stock: 999, received: 1234 },
  { id: 102, name: '满99减20', type: 1, threshold: 99, discount: 20, scope: '全场通用', expireDays: 15, source: '领取', stock: 500, received: 866 },
  { id: 103, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场通用', expireDays: 7, source: '领取', stock: 200, received: 198 },
  { id: 104, name: '88折优惠券', type: 2, threshold: 100, discount: 88, scope: '限坚果/礼盒品类', expireDays: 10, source: '领取', stock: 300, received: 152 },
  { id: 105, name: '满199减50', type: 1, threshold: 199, discount: 50, scope: '全场通用', expireDays: 30, source: '领取', stock: 100, received: 76 },
  { id: 106, name: '膨化品类3元券', type: 3, threshold: 0, discount: 3, scope: '限膨化品类', expireDays: 5, source: '领取', stock: 400, received: 233 },
  { id: 107, name: '满88减15', type: 1, threshold: 88, discount: 15, scope: '全场通用', expireDays: 20, source: '领取', stock: 600, received: 401 },
  { id: 108, name: '新人满39减8', type: 1, threshold: 39, discount: 8, scope: '全场通用', expireDays: 30, source: '领取', stock: 999, received: 1520 }
];

/** 用户已持有的券（我的优惠券） */
const userCoupons = [
  { id: 1, couponId: 101, name: '满59减10', type: 1, threshold: 59, discount: 10, scope: '全场通用', status: 1, expireTime: fmt(9, 'YYYY-MM-DD') + ' 23:59', source: '领取' },
  { id: 2, couponId: 103, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场通用', status: 1, expireTime: fmt(3, 'YYYY-MM-DD') + ' 23:59', source: '积分兑换' },
  { id: 3, couponId: 107, name: '满88减15', type: 1, threshold: 88, discount: 15, scope: '全场通用', status: 1, expireTime: fmt(20, 'YYYY-MM-DD') + ' 23:59', source: '生日赠送' },
  { id: 4, couponId: 102, name: '满99减20', type: 1, threshold: 99, discount: 20, scope: '全场通用', status: 2, expireTime: fmt(-5, 'YYYY-MM-DD') + ' 23:59', source: '领取', usedOrderId: 'SN20260828001' },
  { id: 5, couponId: 106, name: '膨化品类3元券', type: 3, threshold: 0, discount: 3, scope: '限膨化品类', status: 3, expireTime: fmt(-10, 'YYYY-MM-DD') + ' 23:59', source: '领取' }
];

module.exports = { templates, userCoupons };
