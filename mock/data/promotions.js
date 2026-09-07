/**
 * 促销活动 Mock 数据（字段与 4.11 promotion 对齐）
 * type：1限时抢购 / 2满减阶梯
 */
const { fmt } = require('../_time.js');

const promotions = [
  {
    id: 1,
    type: 1,
    title: '限时秒杀 · 10点场',
    subtitle: '每天 10:00 开抢，抢完即止',
    startTime: fmt(0, 'YYYY-MM-DD') + ' 10:00:00',
    endTime: fmt(2, 'YYYY-MM-DD') + ' 22:00:00',
    endTimestamp: Date.now() + 2 * 86400000,
    seckillGoods: [
      { goodsId: 1, seckillPrice: 3.9, originalPrice: 6.9, stock: 100, sold: 82, soldPercent: 82 },
      { goodsId: 10, seckillPrice: 39.9, originalPrice: 59.9, stock: 50, sold: 41, soldPercent: 82 },
      { goodsId: 19, seckillPrice: 9.9, originalPrice: 18.9, stock: 80, sold: 63, soldPercent: 79 },
      { goodsId: 23, seckillPrice: 1.9, originalPrice: 3.9, stock: 200, sold: 187, soldPercent: 94 },
      { goodsId: 28, seckillPrice: 49.9, originalPrice: 69.9, stock: 30, sold: 12, soldPercent: 40 }
    ]
  },
  {
    id: 2,
    type: 2,
    title: '全场满减 · 囤货节',
    subtitle: '多买多减，上不封顶',
    startTime: fmt(0, 'YYYY-MM-DD') + ' 00:00:00',
    endTime: fmt(5, 'YYYY-MM-DD') + ' 23:59:59',
    endTimestamp: Date.now() + 5 * 86400000,
    fullReduceRules: [
      { threshold: 59, reduce: 8 },
      { threshold: 99, reduce: 20 },
      { threshold: 199, reduce: 50 }
    ]
  }
];

/** 根据商品金额计算满减优惠 */
function calcFullReduce(amount) {
  const rules = promotions[1].fullReduceRules;
  let reduce = 0;
  rules.forEach((r) => {
    if (Number(amount) >= r.threshold && r.reduce > reduce) reduce = r.reduce;
  });
  return reduce;
}

module.exports = { promotions, calcFullReduce };
