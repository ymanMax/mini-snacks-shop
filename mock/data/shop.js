// mock/data/shop.js —— 店铺信息 + 配送费规则
module.exports = {
  shopId: 1,
  name: '零食商城·直营店',
  logo: '/static/mock/logo.png',
  score: 4.8,
  subScores: { fresh: 4.9, speed: 4.8, package: 4.7 },
  notice: '本店所有商品满 59 元免基础配送费，每日 08:00-22:00 营业，下单后最快 45 分钟送达。',
  businessHours: '08:00-22:00',
  address: '浙江省杭州市西湖区文三路 88 号零食商城直营店',
  photos: ['/static/mock/shop1.png', '/static/mock/shop2.png', '/static/mock/shop3.png'],
  // 起步 5 元含 3km，超出 1 元/km，满 59 免基础配送费，超过 5km 暂不配送
  deliveryRule: { baseFee: 5, baseKm: 3, perKmFee: 1, freeThreshold: 59, maxKm: 5 }
};
