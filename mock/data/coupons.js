// mock/data/coupons.js —— 优惠券模板与初始持券记录
const { offsetTime, fmtDate } = require('../util');

// 领券中心可领模板
const couponTemplates = [
  { id: 1, name: '满 59 减 8', type: 1, threshold: 59, discount: 8, scope: '全场通用', expireDesc: '领取后 7 天有效' },
  { id: 2, name: '满 99 减 20', type: 1, threshold: 99, discount: 20, scope: '全场通用', expireDesc: '领取后 7 天有效' },
  { id: 3, name: '满 199 减 50', type: 1, threshold: 199, discount: 50, scope: '礼盒专区', expireDesc: '领取后 15 天有效' },
  { id: 4, name: '8.8 折券', type: 2, threshold: 99, discount: 88, scope: '全场通用', expireDesc: '领取后 5 天有效' },
  { id: 5, name: '5 元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场通用', expireDesc: '领取后 3 天有效' },
  { id: 6, name: '满 29 减 5', type: 1, threshold: 29, discount: 5, scope: '膨化食品', expireDesc: '领取后 7 天有效' }
];

// 用户初始持券：[模板id, 状态1未使用/2已使用/3已过期, 来源, 到期偏移天]
const MINE_SEED = [
  [1, 1, '领取', 9],
  [2, 1, '生日赠送', 20],
  [5, 1, '积分兑换', 2],
  [6, 2, '领取', -3],
  [1, 3, '领取', -1],
  [4, 3, '领取', -10]
];

function buildMyCoupons() {
  return MINE_SEED.map(([tid, status, source, dayOffset], idx) => {
    const tpl = couponTemplates.find((t) => t.id === tid);
    return Object.assign({}, tpl, {
      id: 8001 + idx,
      templateId: tid,
      status,
      source,
      receiveTime: offsetTime(-20 + idx),
      expireTime: fmtDate(new Date(Date.now() + dayOffset * 86400000))
    });
  });
}

module.exports = { couponTemplates, buildMyCoupons };
