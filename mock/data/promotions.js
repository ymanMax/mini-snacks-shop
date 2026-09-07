// mock/data/promotions.js —— 促销活动（限时抢购 + 满减阶梯 + 团购批发）
const { round2, offsetTime, fmtTime } = require('../util');

// 满减阶梯（购物车/下单自动生效）
const fullReduceRules = [
  { threshold: 59, reduce: 8 },
  { threshold: 99, reduce: 20 },
  { threshold: 199, reduce: 50 }
];

// 限时抢购：[goodsId, 折扣, 已售百分比, 抢购库存]
const SECKILL_SEED = [
  [3, 0.72, 78, 200],
  [7, 0.66, 45, 150],
  [12, 0.8, 92, 300],
  [18, 0.75, 60, 80],
  [22, 0.7, 35, 240],
  [30, 0.78, 20, 60]
];

function buildSeckill(goodsList) {
  return {
    id: 1,
    type: 1,
    title: '今日限时抢购',
    startTime: offsetTime(0, -2),
    endTime: offsetTime(0, 6),
    endText: '今日 22:00 结束',
    goods: SECKILL_SEED.map(([gid, discount, soldPercent, stock]) => {
      const g = goodsList.find((x) => x.id === gid);
      return {
        goodsId: gid,
        name: g.name,
        pic: g.pic,
        price: g.price,
        seckillPrice: round2(g.price * discount),
        stock,
        soldPercent,
        total: stock
      };
    })
  };
}

// 团购批发：买得越多单价越低
const WHOLESALE_SEED = [
  [1, [[5, 6.5], [10, 5.9], [30, 5.5]]],
  [21, [[12, 4.9], [24, 4.5], [48, 4.2]]],
  [12, [[6, 11.8], [12, 10.9], [24, 9.9]]]
];

function buildWholesale(goodsList) {
  return WHOLESALE_SEED.map(([gid, ladder], idx) => {
    const g = goodsList.find((x) => x.id === gid);
    return {
      id: idx + 1,
      goodsId: gid,
      title: g.name + ' · 拼单批发价',
      pic: g.pic,
      price: g.price,
      ladder: ladder.map(([count, price]) => ({ count, price }))
    };
  });
}

// 抢购场次：固定时段 + 状态实时计算（秒）
const SESSION_DEFS = [
  { id: 1, name: '10:00场', sh: 10, eh: 12 },
  { id: 2, name: '14:00场', sh: 14, eh: 16 },
  { id: 3, name: '20:00场', sh: 20, eh: 22 }
];

function todayAt(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute || 0, 0, 0);
  return d;
}

// 抢购商品只构建一次（soldPercent 在会话内可变）
let cachedSeckillGoods = null;
function getSeckillGoods(goodsList) {
  if (!cachedSeckillGoods) cachedSeckillGoods = buildSeckill(goodsList).goods;
  return cachedSeckillGoods;
}

function buildSessions(goodsList) {
  const goods = getSeckillGoods(goodsList);
  const now = Date.now();
  const sessions = SESSION_DEFS.map((def) => {
    const start = todayAt(def.sh);
    const end = todayAt(def.eh);
    let status = 0; // 0 即将开始 1 抢购中 2 已结束
    if (now >= end.getTime()) status = 2;
    else if (now >= start.getTime()) status = 1;
    return {
      id: def.id,
      name: def.name,
      startTime: fmtTime(start),
      endTime: fmtTime(end),
      startSeconds: Math.max(0, Math.floor((start.getTime() - now) / 1000)),
      endSeconds: Math.max(0, Math.floor((end.getTime() - now) / 1000)),
      status,
      statusText: status === 1 ? '抢购中' : (status === 0 ? '即将开始' : '已结束'),
      goods
    };
  });
  // 保证始终有一场可抢购的“即时场”
  if (!sessions.some((s) => s.status === 1)) {
    const start = new Date(now - 3600000);
    const end = new Date(now + 3 * 3600000);
    sessions.unshift({
      id: 0,
      name: '即时场',
      startTime: fmtTime(start),
      endTime: fmtTime(end),
      startSeconds: 0,
      endSeconds: Math.floor((end.getTime() - now) / 1000),
      status: 1,
      statusText: '抢购中',
      goods
    });
  } else {
    sessions.unshift(sessions.splice(sessions.findIndex((s) => s.status === 1), 1)[0]);
  }
  return sessions;
}

module.exports = {
  fullReduceRules,
  buildSeckill,
  buildWholesale,
  buildSessions,
  getSeckillGoods
};
