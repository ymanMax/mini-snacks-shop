// mock/data/shop.js —— 店铺信息 + 配送费规则
const shop = {
  shopId: 1,
  name: '零食商城·直营店',
  logo: '/static/mock/shop1.jpg',
  score: 4.8,
  subScores: { fresh: 4.9, speed: 4.8, package: 4.7 },
  notice: '本店所有商品均为品牌直供，当季新货，坏果包赔；每日 22:00 前下单当日发货。',
  businessHours: '08:00-22:00',
  phone: '400-888-8888',
  address: '上海市浦东新区美食街 88 号零食大厦 1 层',
  photos: [
    '/static/mock/shop1.jpg',
    '/static/mock/shop2.jpg',
    '/static/mock/shop3.jpg'
  ],
  // 起步 5 元含 3km，超出 1 元/km，满 59 免配送费，20km 外不支持配送
  deliveryRule: {
    baseFee: 5,
    baseKm: 3,
    perKmFee: 1,
    freeThreshold: 59,
    maxKm: 20,
    etaText: '预计 45 分钟送达'
  }
};

module.exports = shop;
