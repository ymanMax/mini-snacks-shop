// mock/data/shop.js —— 店铺信息与配送费规则
const shop = {
  shopId: 1,
  name: '零食商城·直营店',
  logo: '/static/mock/logo.png',
  score: 4.8,
  subScores: { fresh: 4.9, speed: 4.8, package: 4.7 },
  notice: '本店商品均为近 30 天内生产，顺丰包邮当日发货，满 59 元免基础配送费，坏损包赔！',
  businessHours: '08:00-22:00',
  address: '浙江省杭州市西湖区文三路 138 号零食大厦 1 层',
  phone: '0571-88886666',
  photos: [
    '/static/mock/shop/s01.jpg',
    '/static/mock/shop/s02.jpg',
    '/static/mock/shop/s03.jpg'
  ],
  deliveryRule: {
    baseFee: 5, // 起步配送费
    baseKm: 3, // 含 3km
    perKmFee: 1, // 超出 1 元/km
    freeThreshold: 59, // 满 59 免基础配送费
    rangeKm: 15 // 最大配送范围
  },
  deliverySlots: [
    '尽快送达（预计45分钟）',
    '今天 10:00-12:00',
    '今天 12:00-14:00',
    '今天 14:00-16:00',
    '今天 16:00-18:00',
    '今天 18:00-20:00'
  ]
}

module.exports = shop
