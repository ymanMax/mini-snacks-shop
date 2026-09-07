// mock/data/orders.js —— 10+ 条订单（覆盖全部状态）
// status: 1待付款 2待发货 3配送中 4待收货 5已完成 6已取消
// 时间在模块加载时按当前时间相对生成，保证演示时时间线自然

function daysAgo(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour == null ? 10 : hour, Math.floor(Math.random() * 50) + 5, 0, 0);
  return d.getTime();
}

function fmt(ts) {
  const d = new Date(ts);
  const p = n => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const ADDR = { name: '张小零', phone: '13812348888', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文三路 100 号创业大厦 8 楼 801 室' };

function item(goodsId, name, pic, specText, price, count) {
  return { goodsId, name, pic, specText, price, count };
}

// 生成订单号
let seq = 0;
function orderNo(ts) {
  seq += 1;
  const d = new Date(ts);
  const p = n => (n < 10 ? '0' + n : '' + n);
  return `SN${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${String(10000 + seq * 37).slice(1)}`;
}

function build(o) {
  const totalAmount = o.items.reduce((s, it) => Math.round((s + it.price * it.count) * 100) / 100, 0);
  const discountAmount = o.discountAmount || 0;
  const freight = o.freight == null ? (totalAmount >= 59 ? 0 : 5) : o.freight;
  const payAmount = Math.round((totalAmount - discountAmount + freight) * 100) / 100;
  const created = o.created;
  const timeline = [{ time: fmt(created), status: '订单已提交', remark: '您的订单已提交成功' }];
  if (o.status >= 2 && o.status !== 6) timeline.push({ time: fmt(created + 5 * 60000), status: '支付成功', remark: o.payType === 2 ? '货到付款订单已确认' : '微信支付成功' });
  if (o.status >= 3) timeline.push({ time: fmt(created + 25 * 60000), status: '分拣完成', remark: '商品已分拣打包完成' });
  if (o.status >= 3) timeline.push({ time: fmt(created + 40 * 60000), status: '骑手取货', remark: '骑手已取货，正在配送途中' });
  if (o.status >= 4) timeline.push({ time: fmt(created + 62 * 60000), status: '已送达', remark: '商品已送达，请确认收货' });
  if (o.status === 5) timeline.push({ time: fmt(created + 62 * 60000 + 3600000), status: '交易完成', remark: '感谢您的购买，欢迎再次光临' });
  if (o.status === 6) timeline.push({ time: fmt(created + 30 * 60000), status: '订单已取消', remark: '超时未支付，订单自动取消' });
  return {
    id: o.id,
    orderNo: orderNo(created),
    status: o.status,
    items: o.items,
    totalAmount, discountAmount, freight, payAmount,
    couponId: o.couponId || null,
    couponTitle: o.couponTitle || '',
    payType: o.payType || 1,
    remark: o.remark || '',
    deliveryDate: o.deliveryDate || '今天',
    deliverySlot: o.deliverySlot || '尽快送达（预计45分钟）',
    addressSnapshot: o.address || ADDR,
    rider: o.status >= 3 && o.status !== 6 ? { name: '王师傅', phone: '136****5678' } : null,
    timeline,
    isReviewed: !!o.isReviewed,
    createTime: fmt(created),
    createdTs: created
  };
}

module.exports = [
  build({ id: 1, status: 1, created: daysAgo(0, 9), items: [item(25, '零食大礼包 30 包', '/static/mock/goods20.png', '30 包畅享装 · 混合装', 69.9, 1), item(6, '果汁软糖混合装', '/static/mock/goods5.png', '200g*2袋 · 混合水果', 18.9, 2)] }),
  build({ id: 2, status: 2, created: daysAgo(0, 8), payType: 1, remark: '放前台即可，谢谢', items: [item(9, '每日坚果混合装', '/static/mock/goods7.png', '25g*30包 整箱 · 经典混合', 99.0, 1)] }),
  build({ id: 3, status: 3, created: daysAgo(0, 7), items: [item(18, '风干牛肉干', '/static/mock/goods14.png', '250g*1袋 · 麻辣味', 59.9, 1), item(22, '0 糖气泡水', '/static/mock/goods18.png', '480ml*6瓶 · 白桃味', 29.9, 1)] }),
  build({ id: 4, status: 4, created: daysAgo(1, 18), items: [item(13, '黄油曲奇礼盒', '/static/mock/goods11.png', '200g 铁盒 · 原味', 32.9, 2)] }),
  build({ id: 5, status: 5, created: daysAgo(2, 15), isReviewed: false, items: [item(1, '原切香脆薯片', '/static/mock/goods1.png', '70g*6袋 · 烧烤味', 28.9, 1), item(27, '泰国脆海苔', '/static/mock/goods23.png', '36g*3袋 · 辣味', 29.9, 1)] }),
  build({ id: 6, status: 5, created: daysAgo(3, 11), isReviewed: true, items: [item(17, '蜜汁猪肉脯', '/static/mock/goods15.png', '200g*3袋 · 蜜汁味', 79.9, 1)] }),
  build({ id: 7, status: 5, created: daysAgo(5, 20), isReviewed: false, items: [item(16, '手工蛋黄酥', '/static/mock/goods11.png', '6枚装 · 红豆沙', 36.9, 1), item(21, '低温风味酸奶', '/static/mock/goods17.png', '200g*10盒 · 黄桃燕麦', 45.9, 1)] }),
  build({ id: 8, status: 5, created: daysAgo(7, 14), isReviewed: true, couponTitle: '满59减8', discountAmount: 8, items: [item(24, '臻品坚果礼盒', '/static/mock/goods19.png', '1.2kg 礼盒 · 经典款', 128.0, 1)] }),
  build({ id: 9, status: 6, created: daysAgo(8, 16), items: [item(5, '黑巧克力礼盒装', '/static/mock/goods4.png', '240g 礼盒 · 85%黑巧', 69.9, 1)] }),
  build({ id: 10, status: 5, created: daysAgo(10, 10), isReviewed: true, items: [item(10, '炭烧腰果', '/static/mock/goods8.png', '250g*2罐 · 盐焗味', 65.9, 1), item(14, '全麦苏打饼干', '/static/mock/goods12.png', '300g*2袋 · 香葱味', 19.9, 2)] }),
  build({ id: 11, status: 6, created: daysAgo(12, 9), items: [item(29, '韩国蜂蜜黄油薯片', '/static/mock/goods22.png', '60g*3袋 · 蜂蜜黄油味', 32.9, 2)] })
];
