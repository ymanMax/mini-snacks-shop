// mock/data/points.js —— 积分记录与积分兑换专区
const { daysAgo, fmt } = require('../util.js')

// 1购物 2签到 3评价 4兑换消耗 5生日赠送
const pointsRecords = [
  { id: 1, type: 1, points: 36, desc: '订单 SN0902 完成，购物返积分', createTime: fmt(daysAgo(1, 20, 30)) },
  { id: 2, type: 2, points: 10, desc: '每日签到奖励（连签第 3 天）', createTime: fmt(daysAgo(1, 9, 5)) },
  { id: 3, type: 3, points: 20, desc: '商品评价奖励：奶油夏威夷果', createTime: fmt(daysAgo(2, 18, 12)) },
  { id: 4, type: 2, points: 5, desc: '每日签到奖励', createTime: fmt(daysAgo(2, 8, 50)) },
  { id: 5, type: 1, points: 88, desc: '订单 SN0828 完成，购物返积分', createTime: fmt(daysAgo(4, 19, 2)) },
  { id: 6, type: 4, points: -200, desc: '积分兑换：5 元无门槛优惠券', createTime: fmt(daysAgo(5, 12, 40)) },
  { id: 7, type: 2, points: 50, desc: '连签满 7 天大奖', createTime: fmt(daysAgo(6, 9, 10)) },
  { id: 8, type: 1, points: 15, desc: '订单 SN0824 完成，购物返积分', createTime: fmt(daysAgo(8, 21, 15)) },
  { id: 9, type: 5, points: 200, desc: '银卡生日礼包赠送', createTime: fmt(daysAgo(28, 10, 0)) },
  { id: 10, type: 2, points: 5, desc: '每日签到奖励', createTime: fmt(daysAgo(9, 8, 30)) },
  { id: 11, type: 1, points: 52, desc: '订单 SN0815 完成，购物返积分', createTime: fmt(daysAgo(16, 20, 0)) },
  { id: 12, type: 4, points: -500, desc: '积分兑换：香辣味薯片尝鲜装', createTime: fmt(daysAgo(20, 15, 22)) }
]

// 积分兑换专区
const exchangeGoods = [
  { id: 1, name: '5元无门槛优惠券', pic: '/static/mock/goods/g05.jpg', points: 200, type: 'coupon', stock: 999, redeemed: 128 },
  { id: 2, name: '香辣味薯片尝鲜装', pic: '/static/mock/goods/g01.jpg', points: 500, type: 'goods', stock: 30, redeemed: 56 },
  { id: 3, name: '每日坚果 7 日装', pic: '/static/mock/goods/g10.jpg', points: 800, type: 'goods', stock: 20, redeemed: 34 },
  { id: 4, name: '满59减8优惠券', pic: '/static/mock/goods/g25.jpg', points: 380, type: 'coupon', stock: 999, redeemed: 76 }
]

const rules = [
  '购物实付 1 元累计 1 积分，订单完成后自动到账；',
  '每日签到可获 5~50 积分，连续签到第 7 天领取 50 积分大奖；',
  '发表带图评价奖励 20 积分，纯文字评价奖励 10 积分；',
  '生日当月可领取对应等级的生日礼包积分；',
  '积分可用于兑换优惠券与零食好物，兑换后不可退还；',
  '积分有效期为获取之日起 12 个月，请及时使用。'
]

module.exports = {
  pointsRecords: pointsRecords,
  exchangeGoods: exchangeGoods,
  rules: rules
}
