// mock/data/promotions.js —— 促销活动（限时抢购 + 满减阶梯）

function hoursLater(h) {
  return new Date(Date.now() + h * 3600000).getTime();
}

// 限时抢购场次：进行中 + 即将开始
const sessions = [
  {
    id: 1,
    title: '进行中 · 今日 10 点场',
    startTime: new Date().setHours(10, 0, 0, 0),
    endTime: hoursLater(6),
    status: 1, // 1进行中 2即将开始 3已结束
    goods: [
      { goodsId: 1, name: '原切香脆薯片', pic: '/static/mock/goods1.png', seckillPrice: 9.9, originalPrice: 15.9, stock: 100, soldPercent: 78 },
      { goodsId: 6, name: '果汁软糖混合装', pic: '/static/mock/goods5.png', seckillPrice: 12.9, originalPrice: 18.9, stock: 80, soldPercent: 45 },
      { goodsId: 22, name: '0 糖气泡水', pic: '/static/mock/goods18.png', seckillPrice: 19.9, originalPrice: 29.9, stock: 60, soldPercent: 62 },
      { goodsId: 29, name: '韩国蜂蜜黄油薯片', pic: '/static/mock/goods22.png', seckillPrice: 24.9, originalPrice: 32.9, stock: 50, soldPercent: 30 }
    ]
  },
  {
    id: 2,
    title: '即将开始 · 今日 20 点场',
    startTime: hoursLater(10),
    endTime: hoursLater(14),
    status: 2,
    goods: [
      { goodsId: 17, name: '蜜汁猪肉脯', pic: '/static/mock/goods15.png', seckillPrice: 22.9, originalPrice: 28.9, stock: 120, soldPercent: 0 },
      { goodsId: 13, name: '黄油曲奇礼盒', pic: '/static/mock/goods11.png', seckillPrice: 26.9, originalPrice: 32.9, stock: 90, soldPercent: 0 },
      { goodsId: 18, name: '风干牛肉干', pic: '/static/mock/goods14.png', seckillPrice: 49.9, originalPrice: 59.9, stock: 60, soldPercent: 0 },
      { goodsId: 16, name: '手工蛋黄酥', pic: '/static/mock/goods11.png', seckillPrice: 29.9, originalPrice: 36.9, stock: 80, soldPercent: 0 }
    ]
  },
  {
    id: 3,
    title: '昨日 10 点场',
    startTime: new Date(Date.now() - 86400000).setHours(10, 0, 0, 0),
    endTime: new Date(Date.now() - 86400000).setHours(16, 0, 0, 0),
    status: 3,
    goods: [
      { goodsId: 25, name: '零食大礼包 30 包', pic: '/static/mock/goods20.png', seckillPrice: 59.9, originalPrice: 69.9, stock: 100, soldPercent: 100 }
    ]
  }
];

module.exports = {
  // 兼容旧结构：首页使用的进行中场次
  seckill: {
    id: 1,
    type: 1,
    title: '限时抢购 · 每日 10 点开抢',
    startTime: sessions[0].startTime,
    endTime: sessions[0].endTime,
    goods: sessions[0].goods
  },
  sessions: sessions,
  fullReduce: {
    id: 2,
    type: 2,
    title: '满减阶梯 · 多买多省',
    rules: [
      { threshold: 59, reduce: 8 },
      { threshold: 99, reduce: 20 },
      { threshold: 199, reduce: 50 }
    ]
  }
};
