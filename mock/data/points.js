// mock/data/points.js —— 积分记录种子数据
// pointsRecord: id, type(1购物 2签到 3评价 4兑换消耗 5生日赠送), points(正负), desc, createTime

function daysAgo(n, h) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h || 12, 0, 0, 0);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = [
  { id: 1, type: 1, points: 99, desc: '购物消费 99.00 元', createTime: daysAgo(0, 8) },
  { id: 2, type: 2, points: 5, desc: '每日签到奖励', createTime: daysAgo(0, 7) },
  { id: 3, type: 3, points: 20, desc: '评价订单奖励', createTime: daysAgo(2, 15) },
  { id: 4, type: 2, points: 10, desc: '连续签到 3 天奖励', createTime: daysAgo(2, 7) },
  { id: 5, type: 1, points: 79, desc: '购物消费 79.90 元', createTime: daysAgo(3, 11) },
  { id: 6, type: 4, points: -200, desc: '积分兑换 5 元无门槛券', createTime: daysAgo(5, 20) },
  { id: 7, type: 5, points: 100, desc: '生日月专属赠送', createTime: daysAgo(30, 0) },
  { id: 8, type: 1, points: 128, desc: '购物消费 128.00 元', createTime: daysAgo(7, 14) }
];
