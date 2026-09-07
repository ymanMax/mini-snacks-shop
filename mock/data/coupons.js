// mock/data/coupons.js —— 优惠券模板与用户持券
const { daysAgo, fmt } = require('../util.js')

function expire(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(23, 59, 59, 0)
  return fmt(d)
}

// 可领取的优惠券模板
// type: 1满减 2折扣(discount=88 表示 8.8 折) 3无门槛
const couponTemplates = [
  { id: 1, name: '满59减8券', type: 1, threshold: 59, discount: 8, scope: '全场', scopeLabel: '全场通用', total: 10000, received: 6820, expireDays: 15 },
  { id: 2, name: '满99减20券', type: 1, threshold: 99, discount: 20, scope: '全场', scopeLabel: '全场通用', total: 8000, received: 4210, expireDays: 20 },
  { id: 3, name: '满199减50券', type: 1, threshold: 199, discount: 50, scope: '全场', scopeLabel: '全场通用', total: 5000, received: 1980, expireDays: 30 },
  { id: 4, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场', scopeLabel: '新人专享', total: 20000, received: 15600, expireDays: 10 },
  { id: 5, name: '8.8折券', type: 2, threshold: 39, discount: 88, scope: '全场', scopeLabel: '满39可用', total: 6000, received: 2330, expireDays: 15 },
  { id: 6, name: '膨化糖果满29减5券', type: 1, threshold: 29, discount: 5, scope: 'category', scopeLabel: '膨化食品/糖果巧克力', categoryIds: [1, 2], total: 9000, received: 3100, expireDays: 12 }
]

// 用户已持有的券
const myCoupons = [
  { instanceId: 9001, templateId: 4, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场', scopeLabel: '全场通用', status: 1, source: '新人专享', expireTime: expire(9) },
  { instanceId: 9002, templateId: 1, name: '满59减8券', type: 1, threshold: 59, discount: 8, scope: '全场', scopeLabel: '全场通用', status: 1, source: '签到领取', expireTime: expire(14) },
  { instanceId: 9003, templateId: 2, name: '满99减20券', type: 1, threshold: 99, discount: 20, scope: '全场', scopeLabel: '全场通用', status: 2, source: '活动领取', expireTime: expire(-1), usedOrderNo: 'SN08286612' },
  { instanceId: 9004, templateId: 4, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场', scopeLabel: '全场通用', status: 3, source: '生日赠送', expireTime: fmt(daysAgo(3)) }
]

module.exports = {
  couponTemplates: couponTemplates,
  myCoupons: myCoupons,
  expire: expire
}
