// mock/data/promotions.js —— 首页轮播、主题、限时抢购、满减活动
const { goodsList, G } = require('./goods.js')
const { r2, endOfToday } = require('../util.js')

const banners = [
  {
    id: 1,
    name: '零食大促 8 折起',
    pic: '/static/mock/banner/b01.jpg',
    description: '千款网红零食 限时直降',
    link: '/pages/list/list?item=1'
  },
  {
    id: 2,
    name: '新品首发季',
    pic: '/static/mock/banner/b02.jpg',
    description: '尝鲜价 第二件半价',
    link: '/pages/list/list?item=2'
  },
  {
    id: 3,
    name: '会员尊享日',
    pic: '/static/mock/banner/b03.jpg',
    description: '领券立减 积分翻倍',
    link: '/pages/coupon/coupon'
  }
]

const themes = [
  { id: 1, name: '人气热卖', description: '好评如潮的爆款清单', pic: '/static/mock/theme/t01.jpg', productIds: [10, 17, 23, 1, 28, 12] },
  { id: 2, name: '新品上市', description: '本周上新 抢先尝鲜', pic: '/static/mock/theme/t02.jpg', productIds: [22, 16, 29, 32, 6, 24] },
  { id: 3, name: '特惠专区', description: '高性价比 闭眼囤', pic: '/static/mock/theme/t03.jpg', productIds: [4, 8, 23, 7, 14, 15] }
]

// 限时抢购（6 款）
const seckillIds = [1, 5, 9, 13, 17, 23]
const soldPercents = [68, 42, 85, 30, 56, 77]
const seckillGoods = seckillIds.map(function (id, i) {
  const g = goodsList.find(function (x) { return x.id === id })
  return {
    goodsId: id,
    name: g.name,
    pic: g.pic,
    price: g.price,
    seckillPrice: r2(g.price * (0.68 + (id % 3) * 0.06)),
    stock: 100,
    soldPercent: soldPercents[i],
    limit: 2
  }
})

const promotions = {
  banners: banners,
  themes: themes,
  seckill: {
    id: 1,
    title: '限时抢购',
    startTime: '',
    endTime: endOfToday(),
    goods: seckillGoods
  },
  fullReduceRules: [
    { threshold: 59, reduce: 8 },
    { threshold: 99, reduce: 20 },
    { threshold: 199, reduce: 50 }
  ]
}

module.exports = promotions
