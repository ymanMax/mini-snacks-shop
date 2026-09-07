/**
 * 店铺信息 + 配送费规则（字段与 4.15 shop 对齐）
 */
const shop = {
  shopId: 1,
  name: '零食商城·直营店',
  logo: '/static/mock/shop-2.png',
  score: 4.8,
  subScores: { fresh: 4.9, speed: 4.8, package: 4.7 },
  notice: '新用户首单立减 5 元；每日 10:00 限时秒杀；满 59 元免基础配送费。门店现备 300+ 款零食，欢迎下单自提。',
  businessHours: '08:00-22:00',
  address: '广东省深圳市南山区科技园南区零食大厦 1 层',
  phone: '400-800-8888',
  photos: ['/static/mock/shop-1.png', '/static/mock/shop-2.png', '/static/mock/shop-3.png'],
  deliveryRule: {
    baseFee: 5,       // 起步配送费 5 元
    baseKm: 3,        // 含 3km
    perKmFee: 1,      // 超出部分 1 元/km
    freeThreshold: 59,// 满 59 免基础配送费
    maxKm: 60         // 最大配送距离，超出提示"该地址暂不支持配送"
  },
  deliveryText: [
    '1. 起步配送费 5 元，包含 3 公里以内配送；',
    '2. 超出 3 公里部分，每公里加收 1 元；',
    '3. 单笔订单商品满 59 元，免收基础配送费（超出里程费照常收取）；',
    '4. 会员享受更低免配送费门槛（金卡 49 元、铂金/钻石 39 元）；',
    '5. 配送时间 08:00-22:00，平均 45 分钟送达；',
    '6. 配送范围为门店周边 60 公里，超出范围的地址暂不支持配送。'
  ]
};

/**
 * 计算配送费
 * @param {number} amount 商品金额
 * @param {number} distanceKm 距离
 * @param {number} freeThreshold 免配送费门槛（随会员等级变化，默认 59）
 */
function calcFreight(amount, distanceKm, freeThreshold) {
  const rule = shop.deliveryRule;
  const ft = freeThreshold === undefined ? rule.freeThreshold : freeThreshold;
  const km = Number(distanceKm) || 0;
  const extraKm = Math.max(0, Math.ceil(km - rule.baseKm));
  const extraFee = extraKm * rule.perKmFee;
  const baseFee = Number(amount) >= ft ? 0 : rule.baseFee;
  return Math.round((baseFee + extraFee) * 100) / 100;
}

module.exports = { shop, calcFreight };
