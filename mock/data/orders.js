// mock/data/orders.js —— 初始订单（12 条，覆盖全部状态）
const { offsetTime, round2 } = require('../util');

function item(g, specText, price, count) {
  return {
    goodsId: g.id,
    name: g.name,
    pic: g.pic,
    specText,
    price,
    count
  };
}

function timeline(status, baseDaysAgo) {
  const t = (d, h, m) => offsetTime(-d, -h, -m);
  const list = [
    { time: t(baseDaysAgo, 2, 0), status: '订单已提交', remark: '请尽快完成支付' }
  ];
  if (status >= 2) list.push({ time: t(baseDaysAgo, 1, 40), status: '支付成功', remark: '微信支付' });
  if (status >= 3) list.push({ time: t(baseDaysAgo, 1, 0), status: '商家分拣中', remark: '零食商城直营店正在拣货' });
  if (status >= 4) list.push({ time: t(baseDaysAgo, 0, 30), status: '骑手已取货', remark: '骑手正在为您配送' });
  if (status >= 5) list.push({ time: t(baseDaysAgo, 0, 0), status: '订单已送达', remark: '祝您用餐愉快' });
  if (status === 6) list.push({ time: t(baseDaysAgo, 1, 50), status: '订单已取消', remark: '超时未支付，系统自动取消' });
  return list;
}

const RIDERS = [
  { name: '王师傅', phone: '138****2333', avatar: '/static/mock/avatar3.jpg' },
  { name: '李师傅', phone: '139****5678', avatar: '/static/mock/avatar5.jpg' }
];

function buildInitialOrders(goodsList) {
  const pick = (id) => goodsList.find((g) => g.id === id);
  const addr = (idx = 0) => {
    const list = [
      { name: '张小馋', phone: '138****8888', address: '上海市浦东新区博云路 2 号 A 座 12 层' },
      { name: '张小馋', phone: '138****8888', address: '上海市徐汇区漕溪北路 100 号玉兰花园' },
      { name: '李同学', phone: '139****6666', address: '上海市杨浦区国定路 335 号北区公寓' }
    ];
    return list[idx % list.length];
  };

  const defs = [
    // [id后缀, 状态, 商品[[gid, specText, price, count]], 几天前, 优惠, 运费, 优惠券标题, 已评价, 骑手]
    ['0001', 1, [[1, '标准装 · 原味', 6.9, 2], [21, '单瓶 · 白桃味', 5.5, 3]], 0, 0, 5, '', false, null],
    ['0002', 1, [[29, '标准装 · 辣味', 29.9, 1], [31, '标准装 · 原味', 12.9, 2]], 1, 8, 0, '满 59 减 8 券', false, null],
    ['0003', 2, [[5, '标准装 · 牛奶味', 39.9, 1], [8, '标准装 · 原味', 69.9, 1]], 0, 20, 0, '满 99 减 20 券', false, null],
    ['0004', 3, [[18, '标准装 · 麻辣味', 29.9, 2], [7, '标准装 · 原味', 9.9, 1]], 0, 0, 5, '', false, 0],
    ['0005', 4, [[9, '标准装 · 奶油味', 99, 1], [12, '标准装 · 原味', 12.8, 2]], 0, 20, 0, '满 99 减 20 券', false, 1],
    ['0006', 5, [[3, '分享装 · 原味', 31.84, 1], [13, '标准装 · 原味', 16.9, 2]], 2, 8, 0, '满 59 减 8 券', true, 1],
    ['0007', 5, [[25, '经典款 · 经典系列', 128, 1]], 5, 50, 0, '满 199 减 50 券（凑单）', true, 0],
    ['0008', 5, [[17, '标准装 · 原味', 18.9, 2], [20, '标准装 · 香辣味', 32.9, 1]], 8, 0, 5, '', true, 1],
    ['0009', 5, [[22, '6 瓶装 · 原味', 35.1, 1], [24, '单瓶 · 柠檬味', 6.5, 4]], 12, 8, 0, '满 59 减 8 券', false, 0],
    ['0010', 5, [[32, '分享装 · 芝士味', 25.44, 2], [16, '标准装 · 原味', 17.9, 1]], 18, 0, 5, '', false, 1],
    ['0011', 6, [[4, '尝鲜装 · 烧烤味', 10.97, 1]], 3, 0, 5, '', false, null],
    ['0012', 6, [[27, '经典款 · 经典系列', 69, 1]], 6, 0, 0, '', false, null]
  ];

  return defs.map((d, idx) => {
    const [suffix, status, rows, daysAgo, discount, freight, couponTitle, reviewed, riderIdx] = d;
    const items = rows.map(([gid, specText, price, count]) => item(pick(gid), specText, price, count));
    const totalAmount = round2(items.reduce((s, it) => s + it.price * it.count, 0));
    const payAmount = round2(Math.max(0, totalAmount - discount) + (status === 6 ? 0 : freight));
    const a = addr(idx);
    return {
      id: 20001 + idx,
      orderNo: 'SN' + offsetTime(-daysAgo).slice(0, 10).replace(/-/g, '') + suffix,
      status,
      statusText: '',
      items,
      totalAmount,
      discountAmount: discount,
      freight: status === 6 ? 0 : freight,
      payAmount,
      couponId: couponTitle ? 9000 + idx : 0,
      couponTitle,
      payType: 1,
      remark: idx === 2 ? '请尽快发货，谢谢～' : '',
      deliveryDate: offsetTime(-daysAgo).slice(0, 10),
      deliverySlot: idx % 2 === 0 ? '尽快送达（预计45分钟）' : '今天 14:00-16:00',
      addressSnapshot: a,
      rider: riderIdx === null ? null : RIDERS[riderIdx],
      timeline: timeline(status, daysAgo),
      isReviewed: reviewed,
      createTime: timeline(status, daysAgo)[0].time
    };
  });
}

module.exports = { buildInitialOrders };
