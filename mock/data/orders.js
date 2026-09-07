/**
 * 订单 Mock 数据（12 条，覆盖全部 6 种状态，字段与 4.4 order 对齐）
 * status：1待付款 / 2待发货 / 3配送中 / 4待收货 / 5已完成 / 6已取消
 */
const { fmt } = require('../_time.js');
const goodsList = require('./goods.js').list;

const gmap = {};
goodsList.forEach((g) => { gmap[g.id] = g; });

const STATUS_TEXT = {
  1: '待付款', 2: '待发货', 3: '配送中', 4: '待收货', 5: '已完成', 6: '已取消'
};

function item(goodsId, specText, count, price) {
  const g = gmap[goodsId];
  const spec0 = g.specs[0].values[0];
  return {
    goodsId,
    name: g.name,
    pic: g.pic,
    specText: specText || spec0.label,
    price: price !== undefined ? price : spec0.price,
    count
  };
}

function mk(o) {
  const totalAmount = Math.round(o.items.reduce((s, it) => s + it.price * it.count, 0) * 100) / 100;
  const discountAmount = o.discountAmount || 0;
  const freight = o.freight === undefined ? 0 : o.freight;
  const payAmount = o.status === 6 ? 0 : Math.round((totalAmount - discountAmount + freight) * 100) / 100;
  return Object.assign({
    totalAmount,
    discountAmount,
    freight,
    payAmount,
    couponId: null,
    couponTitle: '',
    payType: 1,
    remark: '',
    addressSnapshot: {
      name: '王小零', phone: '138****8888',
      full: '广东省深圳市南山区科技园南区数字大厦 8 栋 1201 室', tag: '公司'
    },
    rider: null,
    isReviewed: false
  }, o);
}

const orders = [
  // ---------- 待付款 ----------
  mk({
    id: 1, orderNo: 'SN20260905001', status: 1, createTime: fmt(0, 'YYYY-MM-DD HH:mm'),
    items: [item(1, '3袋实惠装 · 原味', 2, 19.67), item(23, '6瓶装 · 白桃味', 1, 11.7)],
    payType: 1, remark: '请放前台', deliveryDate: fmt(0, 'YYYY-MM-DD'), deliverySlot: '尽快送达（预计45分钟）',
    timeline: [{ time: fmt(0, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建，等待付款' }]
  }),
  mk({
    id: 2, orderNo: 'SN20260904002', status: 1, createTime: fmt(-1, 'YYYY-MM-DD HH:mm'),
    items: [item(28, '大箱装', 1, 129.8)],
    couponId: 107, couponTitle: '满88减15', discountAmount: 15,
    deliveryDate: fmt(0, 'YYYY-MM-DD'), deliverySlot: '今天 14:00-16:00',
    timeline: [{ time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建，等待付款' }]
  }),

  // ---------- 待发货 ----------
  mk({
    id: 3, orderNo: 'SN20260904001', status: 2, createTime: fmt(-1, 'YYYY-MM-DD HH:mm'),
    items: [item(10, '1盒装', 1), item(12, '1罐装 · 奶油味', 2, 24.9)],
    freight: 5, remark: '', deliveryDate: fmt(0, 'YYYY-MM-DD'), deliverySlot: '尽快送达（预计45分钟）',
    timeline: [
      { time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功，等待门店分拣' }
    ]
  }),
  mk({
    id: 4, orderNo: 'SN20260903002', status: 2, createTime: fmt(-2, 'YYYY-MM-DD HH:mm'),
    items: [item(19, '1袋尝鲜装 · 蜜汁味', 3), item(21, '1盒装 · 麻辣味', 1, 14.9)],
    freight: 5, deliveryDate: fmt(-1, 'YYYY-MM-DD'), deliverySlot: '今天 18:00-20:00',
    timeline: [
      { time: fmt(-2, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-2, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功，等待门店分拣' }
    ]
  }),

  // ---------- 配送中 ----------
  mk({
    id: 5, orderNo: 'SN20260901001', status: 3, createTime: fmt(0, 'YYYY-MM-DD HH:mm'),
    items: [item(1, '1袋尝鲜装 · 烧烤味', 2), item(4, '1盒装 · 焦糖味', 1, 9.9), item(26, '6瓶装', 1, 6.72)],
    freight: 0, discountAmount: 0, deliveryDate: fmt(0, 'YYYY-MM-DD'), deliverySlot: '尽快送达（预计45分钟）',
    rider: { name: '陈骑手', phone: '13712345678', avatar: '/static/mock/avatar-3.png' },
    timeline: [
      { time: fmt(-0.2, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-0.2, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-0.1, 'YYYY-MM-DD HH:mm'), status: 3, remark: '门店已分拣完成' },
      { time: fmt(0, 'YYYY-MM-DD HH:mm'), status: 4, remark: '骑手已取货，正在配送' }
    ]
  }),
  mk({
    id: 6, orderNo: 'SN20260831001', status: 3, createTime: fmt(-1, 'YYYY-MM-DD HH:mm'),
    items: [item(25, '小箱装 · 原味', 1, 29.9)],
    freight: 8, deliveryDate: fmt(-1, 'YYYY-MM-DD'), deliverySlot: '今天 10:00-12:00',
    rider: { name: '刘骑手', phone: '13698765432', avatar: '/static/mock/avatar-4.png' },
    timeline: [
      { time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-0.8, 'YYYY-MM-DD HH:mm'), status: 4, remark: '骑手已取货，正在配送' }
    ]
  }),

  // ---------- 待收货 ----------
  mk({
    id: 7, orderNo: 'SN20260830001', status: 4, createTime: fmt(-2, 'YYYY-MM-DD HH:mm'),
    items: [item(15, '1盒装 · 黄油味', 2, 15.9), item(18, '3袋实惠装 · 巧克力味', 1, 15.4)],
    freight: 0, deliveryDate: fmt(-1, 'YYYY-MM-DD'), deliverySlot: '今天 16:00-18:00',
    rider: { name: '黄骑手', phone: '13555556666', avatar: '/static/mock/avatar-5.png' },
    timeline: [
      { time: fmt(-2, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-2, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-1.5, 'YYYY-MM-DD HH:mm'), status: 4, remark: '骑手配送中' },
      { time: fmt(-1, 'YYYY-MM-DD HH:mm'), status: 5, remark: '商品已送达站点，等待自提/派送' }
    ]
  }),

  // ---------- 已完成 ----------
  mk({
    id: 8, orderNo: 'SN20260828001', status: 5, createTime: fmt(-5, 'YYYY-MM-DD HH:mm'),
    items: [item(10, '30天装', 1, 155.74), item(11, '1罐装', 1, 19.9)],
    couponId: 102, couponTitle: '满99减20', discountAmount: 20, freight: 0,
    isReviewed: true, deliveryDate: fmt(-5, 'YYYY-MM-DD'), deliverySlot: '尽快送达（预计45分钟）',
    timeline: [
      { time: fmt(-5, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-5, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-4.9, 'YYYY-MM-DD HH:mm'), status: 4, remark: '骑手配送中' },
      { time: fmt(-4.8, 'YYYY-MM-DD HH:mm'), status: 6, remark: '订单已完成' }
    ]
  }),
  mk({
    id: 9, orderNo: 'SN20260820002', status: 5, createTime: fmt(-12, 'YYYY-MM-DD HH:mm'),
    items: [item(5, '3袋实惠装 · 经典麻辣', 2, 25.08), item(21, '1盒装 · 甜辣味', 2, 14.9), item(23, '6瓶装 · 柠檬味', 1, 11.7)],
    discountAmount: 8, freight: 5, isReviewed: true,
    deliveryDate: fmt(-12, 'YYYY-MM-DD'), deliverySlot: '今天 14:00-16:00',
    timeline: [
      { time: fmt(-12, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-12, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-11.8, 'YYYY-MM-DD HH:mm'), status: 6, remark: '订单已完成' }
    ]
  }),
  mk({
    id: 10, orderNo: 'SN20260810003', status: 5, createTime: fmt(-20, 'YYYY-MM-DD HH:mm'),
    items: [item(31, '1袋尝鲜装', 3), item(30, '1盒装 · 72%黑巧', 1, 25.9)],
    freight: 0, isReviewed: false,
    deliveryDate: fmt(-20, 'YYYY-MM-DD'), deliverySlot: '尽快送达（预计45分钟）',
    timeline: [
      { time: fmt(-20, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-20, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-19.8, 'YYYY-MM-DD HH:mm'), status: 6, remark: '订单已完成' }
    ]
  }),
  mk({
    id: 11, orderNo: 'SN20260801001', status: 5, createTime: fmt(-30, 'YYYY-MM-DD HH:mm'),
    items: [item(13, '5斤装', 1, 26.88), item(8, '1袋尝鲜装', 2)],
    freight: 5, isReviewed: false,
    deliveryDate: fmt(-30, 'YYYY-MM-DD'), deliverySlot: '今天 18:00-20:00',
    timeline: [
      { time: fmt(-30, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建' },
      { time: fmt(-30, 'YYYY-MM-DD HH:mm'), status: 2, remark: '支付成功' },
      { time: fmt(-29.8, 'YYYY-MM-DD HH:mm'), status: 6, remark: '订单已完成' }
    ]
  }),

  // ---------- 已取消 ----------
  mk({
    id: 12, orderNo: 'SN20260720003', status: 6, createTime: fmt(-40, 'YYYY-MM-DD HH:mm'),
    items: [item(27, '小箱装', 1, 88.0)],
    remark: '拼团未成团，自动取消退款',
    timeline: [
      { time: fmt(-40, 'YYYY-MM-DD HH:mm'), status: 1, remark: '订单已创建（拼团订单）' },
      { time: fmt(-39.5, 'YYYY-MM-DD HH:mm'), status: 6, remark: '24小时未成团，已自动取消并退款' }
    ]
  })
];

module.exports = { orders, STATUS_TEXT };
