// mock/index.js —— Mock 总入口：按 url + method 路由分发
// 统一返回 { code: 200, data, msg }；分页 data: { records, total, current, size, pages }
const { delay } = require('./delay');
const util = require('./util');
const store = require('./store');
const { banners, themes, quickEntries, hotKeywords } = require('./data/home');
const goodsAll = require('./data/goods');
const categories = require('./data/categories');
const reviewsAll = require('./data/reviews');
const shopReviewsAll = require('./data/shopReviews');
const { levels, getLevelByGrowth, getNextLevel } = require('./data/members');
const { couponTemplates } = require('./data/coupons');
const { fullReduceRules, buildSessions, buildWholesale } = require('./data/promotions');
const { buildGroups } = require('./data/groups');
const { exchangeItems, pointsRules } = require('./data/points');
const { checkinRewards, checkinRules } = require('./data/checkin');
const shop = require('./data/shop');

const STATUS_TEXT = { 1: '待付款', 2: '待发货', 3: '配送中', 4: '待收货', 5: '已完成', 6: '已取消' };

function MockError(code, msg) {
  const e = new Error(msg);
  e.code = code;
  return e;
}

function parseQuery(qs) {
  const out = {};
  if (!qs) return out;
  qs.split('&').forEach((kv) => {
    if (!kv) return;
    const i = kv.indexOf('=');
    const k = decodeURIComponent(i === -1 ? kv : kv.slice(0, i));
    const v = i === -1 ? '' : decodeURIComponent(kv.slice(i + 1));
    out[k] = v;
  });
  return out;
}

function findGoods(id) {
  return goodsAll.find((g) => String(g.id) === String(id));
}

function decorateGoods(g) {
  const d = util.clone(g);
  d.isCollect = store.isCollect(g.id);
  return d;
}

function decorateOrder(o) {
  const d = util.clone(o);
  d.statusText = STATUS_TEXT[d.status] || '';
  d.itemCount = d.items.reduce((s, it) => s + it.count, 0);
  d.canReview = d.status === 5 && !d.isReviewed;
  const ticket = store.getTickets().find((t) =>
    String(t.orderId) === String(d.id) && t.status !== 4);
  d.aftersaleId = ticket ? ticket.id : 0;
  d.hasAftersale = !!ticket;
  d.aftersaleStatusText = ticket ? ticket.statusText : '';
  return d;
}

// ---- 金额计算 ----
function calcFullReduce(amount) {
  let reduce = 0;
  fullReduceRules.forEach((r) => { if (amount >= r.threshold) reduce = r.reduce; });
  return reduce;
}

function calcCoupon(coupon, amount) {
  if (!coupon) return 0;
  if (amount < coupon.threshold) return 0;
  if (coupon.type === 2) return util.round2(amount * (100 - coupon.discount) / 100);
  return coupon.discount; // type1 满减 / type3 无门槛
}

// 返回运费；超配送范围返回 null
function calcFreight(amount, distanceKm, freeThreshold) {
  const rule = shop.deliveryRule;
  if (distanceKm > rule.maxKm) return null;
  if (amount >= freeThreshold) return 0;
  const extra = Math.max(0, Math.ceil(distanceKm - rule.baseKm)) * rule.perKmFee;
  return util.round2(rule.baseFee + extra);
}

// 计算最优可用券（满减后金额仍满足门槛时优惠最大者）
function pickBestCoupon(amountAfterFullReduce) {
  const usable = store.getMyCoupons().filter((c) => c.status === 1 && amountAfterFullReduce >= c.threshold);
  let best = null;
  let bestDiscount = 0;
  usable.forEach((c) => {
    const d = Math.min(calcCoupon(c, amountAfterFullReduce), amountAfterFullReduce);
    if (d > bestDiscount) { bestDiscount = d; best = c; }
  });
  return { coupon: best, discount: util.round2(bestDiscount) };
}

function calcPreview(items, addressId, couponId, options) {
  options = options || {};
  const goodsAmount = util.round2(items.reduce((s, it) => s + it.price * it.count, 0));
  const fullReduceAmount = calcFullReduce(goodsAmount);
  const user = store.getUser();
  const level = levels[user.level - 1] || levels[0];

  // 未显式指定券时自动选择最优组合（couponId === '' 表示用户手动选择不使用）
  let coupon = null;
  if (couponId !== '' && couponId !== undefined && couponId !== null && String(couponId) !== '0') {
    coupon = store.getMyCoupons().find((c) =>
      String(c.id) === String(couponId) && c.status === 1 && goodsAmount >= c.threshold);
  } else if (couponId === undefined && options.autoCoupon !== false) {
    coupon = pickBestCoupon(goodsAmount - fullReduceAmount).coupon;
  }
  const couponDiscount = coupon ? Math.min(calcCoupon(coupon, goodsAmount - fullReduceAmount), goodsAmount) : 0;

  const addresses = store.getAddresses();
  const addr = addresses.find((a) => String(a.id) === String(addressId)) || addresses.find((a) => a.isDefault) || addresses[0];
  const distance = addr ? addr.distanceKm : 2;
  const unsupported = distance > shop.deliveryRule.maxKm;
  const amountAfterDiscount = Math.max(0, goodsAmount - fullReduceAmount - couponDiscount);
  const freight = unsupported ? 0 : calcFreight(goodsAmount, distance, level.freeFreightThreshold);

  // 可用券数量（供购物车/确认页提示）
  const usableCoupons = store.getMyCoupons().filter((c) =>
    c.status === 1 && goodsAmount - fullReduceAmount >= c.threshold);

  // 凑单提示：下一档满减 / 免配送费差额
  const nextReduce = fullReduceRules.find((r) => goodsAmount < r.threshold) || null;
  const reduceGap = nextReduce ? util.round2(nextReduce.threshold - goodsAmount) : 0;
  const freightGap = (unsupported || freight === 0 || goodsAmount >= level.freeFreightThreshold)
    ? 0 : util.round2(level.freeFreightThreshold - goodsAmount);

  return {
    goodsAmount,
    fullReduceAmount: util.round2(fullReduceAmount),
    couponId: coupon ? coupon.id : 0,
    couponTitle: coupon ? coupon.name : '',
    couponDiscount: util.round2(couponDiscount),
    usableCouponCount: usableCoupons.length,
    freight,
    unsupported,
    payAmount: util.round2(amountAfterDiscount + freight),
    address: addr || null,
    distanceKm: distance,
    freeFreightThreshold: level.freeFreightThreshold,
    nextReduce,
    reduceGap,
    freightGap
  };
}

// ---- 路由表 ----
const routes = [];
function route(method, re, fn) { routes.push([method, re, fn]); }

// ===== 首页 / 主题 =====
route('GET', /^\/home\/banners$/, () => banners.map((b) => util.clone(b)));
route('GET', /^\/home\/quick$/, () => util.clone(quickEntries));
route('GET', /^\/themes$/, () => themes.map((t) => {
  const x = util.clone(t);
  x.productIds = x.productIds || [];
  return x;
}));
route('GET', /^\/themes\/(\d+)$/, (m) => {
  const t = themes.find((x) => x.id === Number(m[0]));
  if (!t) throw MockError(404, '主题不存在');
  const d = util.clone(t);
  d.products = d.productIds.map(findGoods).filter(Boolean).map(decorateGoods);
  return d;
});

// ===== 分类 =====
route('GET', /^\/categories$/, () => util.clone(categories));

// ===== 商品列表（分页/搜索/筛选/排序）=====
route('GET', /^\/goods\/page$/, (m, q) => {
  let list = goodsAll.slice();
  const kw = (q.keywords || '').trim();
  if (kw) {
    list = list.filter((g) => g.name.indexOf(kw) !== -1 || g.brand.indexOf(kw) !== -1 ||
      g.tags.some((t) => t.indexOf(kw) !== -1));
  }
  if (q.categoryId) list = list.filter((g) => String(g.categoryId) === String(q.categoryId));
  if (q.minPrice !== undefined && q.minPrice !== '') list = list.filter((g) => g.price >= Number(q.minPrice));
  if (q.maxPrice !== undefined && q.maxPrice !== '') list = list.filter((g) => g.price <= Number(q.maxPrice));
  if (q.origins) {
    const arr = String(q.origins).split(',').filter(Boolean);
    if (arr.length) list = list.filter((g) => arr.some((o) => g.origin.indexOf(o) !== -1));
  }
  if (q.inStock === '1' || q.inStock === 'true') list = list.filter((g) => g.stock > 0);
  if (q.hot === '1') list = list.filter((g) => g.hot);
  if (q.themeId) {
    const t = themes.find((x) => String(x.id) === String(q.themeId));
    if (t) list = t.productIds.map(findGoods).filter(Boolean);
  }
  const sort = q.sort || 'default';
  if (sort === 'priceAsc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'priceDesc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'sales') list.sort((a, b) => b.sales - a.sales);
  else list.sort((a, b) => b.hotScore - a.hotScore);
  const page = util.paginate(list.map(decorateGoods), q);
  // 额外回传可选筛选项
  page.origins = Array.from(new Set(goodsAll.map((g) => g.origin.replace(/省|市|维吾尔自治区|壮族自治区|回族自治区/g, '').slice(0, 2))));
  return page;
});

route('GET', /^\/goods\/(\d+)$/, (m) => {
  const g = findGoods(m[0]);
  if (!g) throw MockError(404, '商品不存在或已下架');
  const d = decorateGoods(g);
  d.viewCount += 1;
  return d;
});

route('GET', /^\/goods\/(\d+)\/recommend$/, (m) => {
  const cur = findGoods(m[0]);
  if (!cur) return [];
  return goodsAll.filter((g) => g.categoryId === cur.categoryId && g.id !== cur.id)
    .slice(0, 6).map(decorateGoods);
});

route('GET', /^\/search\/hot$/, () => util.clone(hotKeywords));
route('GET', /^\/search\/suggest$/, (m, q) => {
  const kw = (q.keywords || '').trim();
  if (!kw) return [];
  return goodsAll.filter((g) => g.name.indexOf(kw) !== -1 || g.brand.indexOf(kw) !== -1)
    .slice(0, 8).map((g) => ({ id: g.id, name: g.name, pic: g.pic, price: g.price }));
});

// ===== 购物车 =====
route('GET', /^\/cart$/, () => {
  const list = store.getCart();
  return util.clone(list);
});

route('POST', /^\/cart\/add$/, (m, q, b) => {
  const g = findGoods(b.goodsId);
  if (!g) throw MockError(404, '商品不存在');
  let price = Number(b.price);
  if (!price) {
    // 根据规格名匹配规格价
    const specDim = g.specs.find((s) => s.name === '规格');
    const mv = specDim && specDim.values.find((v) => b.specText && b.specText.indexOf(v.label) !== -1);
    price = mv ? mv.price : g.price;
  }
  const specText = b.specText || '标准装 · 原味';
  const list = store.getCart();
  const exist = list.find((it) => !it.invalid && it.goodsId === g.id && it.specText === specText);
  if (exist) {
    exist.count = Math.min(exist.stock, exist.count + Number(b.count || 1));
  } else {
    list.push({
      id: store.nextSeq('cart'),
      goodsId: g.id,
      name: g.name,
      pic: g.pic,
      specText,
      price: util.round2(price),
      count: Math.min(g.stock, Number(b.count || 1)),
      checked: true,
      stock: g.stock,
      invalid: false
    });
  }
  store.saveCart(list);
  return util.clone(list);
});

route('POST', /^\/cart\/update$/, (m, q, b) => {
  const list = store.getCart();
  const it = list.find((x) => String(x.id) === String(b.id));
  if (it) {
    if (b.count !== undefined) it.count = Math.max(1, Math.min(it.stock || 99, Number(b.count)));
    if (b.checked !== undefined) it.checked = !!b.checked;
  }
  store.saveCart(list);
  return util.clone(list);
});

route('POST', /^\/cart\/toggle-all$/, (m, q, b) => {
  const list = store.getCart();
  list.forEach((it) => { if (!it.invalid) it.checked = !!b.checked; });
  store.saveCart(list);
  return util.clone(list);
});

route('POST', /^\/cart\/delete$/, (m, q, b) => {
  const ids = (b.ids || []).map(String);
  const list = store.getCart().filter((it) => ids.indexOf(String(it.id)) === -1);
  store.saveCart(list);
  return util.clone(list);
});

route('POST', /^\/cart\/clear-invalid$/, () => {
  store.saveCart(store.getCart().filter((it) => !it.invalid));
  return util.clone(store.getCart());
});

route('POST', /^\/cart\/reorder$/, (m, q, b) => {
  const list = store.getCart();
  (b.items || []).forEach((it) => {
    const exist = list.find((x) => !x.invalid && x.goodsId === it.goodsId && x.specText === it.specText);
    if (exist) {
      exist.count = Math.min(exist.stock, exist.count + it.count);
    } else {
      const g = findGoods(it.goodsId);
      list.push({
        id: store.nextSeq('cart'),
        goodsId: it.goodsId,
        name: it.name || (g ? g.name : ''),
        pic: it.pic || (g ? g.pic : ''),
        specText: it.specText || '标准装',
        price: it.price,
        count: it.count,
        checked: true,
        stock: g ? g.stock : 99,
        invalid: false
      });
    }
  });
  store.saveCart(list);
  return util.clone(list);
});

// ===== 地址 =====
route('GET', /^\/addresses$/, () => util.clone(store.getAddresses()));
route('POST', /^\/addresses$/, (m, q, b) => {
  const list = store.getAddresses();
  if (b.isDefault) list.forEach((a) => { a.isDefault = false; });
  if (b.id) {
    const i = list.findIndex((a) => String(a.id) === String(b.id));
    if (i !== -1) list[i] = Object.assign({}, list[i], b);
  } else {
    b.id = store.nextSeq('address');
    if (!list.length) b.isDefault = true;
    list.push(Object.assign({ tag: '家', distanceKm: 5 }, b));
  }
  store.saveAddresses(list);
  return util.clone(list);
});
route('POST', /^\/addresses\/delete$/, (m, q, b) => {
  let list = store.getAddresses().filter((a) => String(a.id) !== String(b.id));
  if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
  store.saveAddresses(list);
  return util.clone(list);
});
route('POST', /^\/addresses\/default$/, (m, q, b) => {
  const list = store.getAddresses();
  list.forEach((a) => { a.isDefault = String(a.id) === String(b.id); });
  store.saveAddresses(list);
  return util.clone(list);
});

// ===== 结算预览 =====
route('POST', /^\/orders\/preview$/, (m, q, b) => {
  const preview = calcPreview(b.items || [], b.addressId, b.couponId);
  preview.fullReduceRules = util.clone(fullReduceRules);
  preview.deliveryRule = util.clone(shop.deliveryRule);
  return preview;
});

// 下单可选优惠券
route('GET', /^\/coupons\/usable$/, (m, q) => {
  const amount = Number(q.amount || 0);
  return util.clone(store.getMyCoupons().filter((c) => c.status === 1 && amount >= c.threshold));
});

// ===== 订单 =====
route('POST', /^\/orders$/, (m, q, b) => {
  const items = (b.items || []).map((it) => ({
    goodsId: it.goodsId,
    name: it.name,
    pic: it.pic,
    specText: it.specText,
    price: util.round2(Number(it.price)),
    count: Number(it.count)
  }));
  if (!items.length) throw MockError(400, '请选择商品');
  const preview = calcPreview(items, b.addressId, b.couponId);
  if (preview.unsupported) throw MockError(400, '该地址超出配送范围（' + shop.deliveryRule.maxKm + 'km），暂不支持配送');
  const addr = preview.address;
  const now = new Date();
  const order = {
    id: store.nextSeq('order'),
    orderNo: util.genOrderNo(),
    status: 1,
    statusText: STATUS_TEXT[1],
    items,
    totalAmount: preview.goodsAmount,
    discountAmount: util.round2(preview.fullReduceAmount + preview.couponDiscount),
    freight: preview.freight,
    payAmount: preview.payAmount,
    couponId: preview.couponId,
    couponTitle: preview.couponTitle,
    payType: Number(b.payType || 1),
    remark: b.remark || '',
    deliveryDate: util.fmtDate(now),
    deliverySlot: b.deliverySlot || '尽快送达（预计45分钟）',
    addressSnapshot: addr ? {
      name: addr.name, phone: addr.phone,
      address: [addr.province, addr.city, addr.district, addr.detail].join('')
    } : { name: '张小馋', phone: '138****8888', address: '上海市浦东新区博云路 2 号' },
    rider: null,
    timeline: [{ time: util.fmtTime(now), status: '订单已提交', remark: '请尽快完成支付' }],
    isReviewed: false,
    createTime: util.fmtTime(now)
  };
  const list = store.getOrders();
  list.unshift(order);
  store.saveOrders(list);
  // 核销优惠券
  if (preview.couponId) {
    const coupons = store.getMyCoupons();
    const c = coupons.find((x) => x.id === preview.couponId);
    if (c) { c.status = 2; store.saveMyCoupons(coupons); }
  }
  // 从购物车下单则清除对应项
  if (b.fromCartIds && b.fromCartIds.length) {
    const ids = b.fromCartIds.map(String);
    store.saveCart(store.getCart().filter((it) => ids.indexOf(String(it.id)) === -1));
  }
  return decorateOrder(order);
});

route('GET', /^\/orders\/page$/, (m, q) => {
  let list = store.getOrders().slice();
  if (q.status && String(q.status) !== '0') list = list.filter((o) => String(o.status) === String(q.status));
  list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
  return util.paginate(list.map(decorateOrder), q);
});

route('GET', /^\/orders\/counts$/, () => {
  const list = store.getOrders();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, review: 0 };
  list.forEach((o) => {
    if (o.status >= 1 && o.status <= 4) counts[o.status] = (counts[o.status] || 0) + 1;
    if (o.status === 5 && !o.isReviewed) counts.review += 1;
  });
  return counts;
});

route('GET', /^\/orders\/(\w+)$/, (m) => {
  const o = store.findOrder(m[0]);
  if (!o) throw MockError(404, '订单不存在');
  return decorateOrder(o);
});

function updateOrder(id, mutator) {
  const list = store.getOrders();
  const o = list.find((x) => String(x.id) === String(id) || String(x.orderNo) === String(id));
  if (!o) throw MockError(404, '订单不存在');
  mutator(o);
  store.saveOrders(list);
  return decorateOrder(o);
}

function pushOrderNode(o, status, remark) {
  o.timeline.push({ time: util.fmtTime(new Date()), status, remark: remark || '' });
}

// 业务联动消息（写入 storage，跨页面/冷启动可见）
function addMessage(type, title, content, relatedId, biz) {
  return store.addMessage({ type, title, content, relatedId: relatedId || 0, biz: biz || '' });
}

route('POST', /^\/orders\/(\w+)\/pay$/, (m) => {
  return updateOrder(m[0], (o) => {
    if (o.status !== 1) throw MockError(400, '当前订单状态不可支付');
    o.status = 2;
    o.payTime = util.fmtTime(new Date());
    pushOrderNode(o, '支付成功', o.payType === 2 ? '货到付款' : '微信支付（演示环境，不产生真实交易）');
    // 支付奖励成长值
    store.changeGrowth(20);
    addMessage(2, '支付成功', `订单 ${o.orderNo} 支付成功，商家正在备货～`, o.id);
  });
});

route('POST', /^\/orders\/(\w+)\/cancel$/, (m) => {
  return updateOrder(m[0], (o) => {
    if (o.status !== 1) throw MockError(400, '仅待付款订单可取消');
    o.status = 6;
    pushOrderNode(o, '订单已取消', '用户主动取消订单');
  });
});

route('POST', /^\/orders\/(\w+)\/receive$/, (m) => {
  return updateOrder(m[0], (o) => {
    if (o.status !== 4) throw MockError(400, '当前订单状态不可确认收货');
    o.status = 5;
    pushOrderNode(o, '订单已送达', '用户确认收货，祝您用餐愉快');
    // 购物奖励积分（实付 1 元 = 1 积分）
    const pts = Math.floor(o.payAmount);
    store.changePoints(pts);
    store.addPointsRecord({ type: 1, points: pts, desc: `订单 ${o.orderNo} 购物奖励`, createTime: util.fmtTime(new Date()) });
    addMessage(2, '订单已送达', `订单 ${o.orderNo} 已送达，确认商品无误后欢迎评价～`, o.id);
  });
});

// Mock 配送状态推进：2→3→4→5
route('POST', /^\/orders\/(\w+)\/advance$/, (m) => {
  return updateOrder(m[0], (o) => {
    if (o.status === 2) {
      o.status = 3;
      pushOrderNode(o, '商家分拣中', '零食商城直营店正在拣货');
      addMessage(2, '订单配送中', `订单 ${o.orderNo} 商家已开始拣货`, o.id);
    } else if (o.status === 3) {
      o.status = 4;
      o.rider = { name: '王师傅', phone: '138****2333', avatar: '/static/mock/avatar3.jpg' };
      pushOrderNode(o, '骑手已取货', `${o.rider.name} 正在为您配送`);
      addMessage(2, '骑手已取货', `骑手${o.rider.name}已取货，预计 30 分钟送达`, o.id);
    } else if (o.status === 4) {
      o.status = 5;
      pushOrderNode(o, '订单已送达', '骑手已送达，期待您的好评');
    } else {
      throw MockError(400, '当前状态无需推进');
    }
  });
});

route('POST', /^\/orders\/(\w+)\/reorder$/, (m) => {
  const o = store.findOrder(m[0]);
  if (!o) throw MockError(404, '订单不存在');
  const list = store.getCart();
  o.items.forEach((it) => {
    const exist = list.find((x) => !x.invalid && x.goodsId === it.goodsId && x.specText === it.specText);
    if (exist) exist.count += it.count;
    else {
      list.push({
        id: store.nextSeq('cart'),
        goodsId: it.goodsId, name: it.name, pic: it.pic, specText: it.specText,
        price: it.price, count: it.count, checked: true,
        stock: findGoods(it.goodsId) ? findGoods(it.goodsId).stock : 99, invalid: false
      });
    }
  });
  store.saveCart(list);
  return util.clone(list);
});

// ===== 评价 =====
route('GET', /^\/reviews\/goods\/(\d+)\/page$/, (m, q) => {
  const goodsId = Number(m[0]);
  const list = reviewsAll.filter((r) => r.goodsId === goodsId);
  const page = util.paginate(list, q);
  const scores = list.map((r) => r.score);
  const avg = scores.length ? util.round2(scores.reduce((a, b) => a + b, 0) / scores.length) : 5;
  const tags = {};
  list.forEach((r) => r.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; }));
  page.summary = {
    avg,
    total: list.length,
    goodRate: list.length ? util.round2(list.filter((r) => r.score >= 4).length / list.length * 100) : 100,
    tags: Object.keys(tags).map((t) => ({ tag: t, count: tags[t] })).sort((a, b) => b.count - a.count).slice(0, 6)
  };
  return page;
});

route('GET', /^\/reviews\/shop\/page$/, (m, q) => util.paginate(shopReviewsAll, q));

route('POST', /^\/orders\/(\w+)\/review$/, (m, q, b) => {
  const id = m[0];
  const o = store.findOrder(id);
  if (!o) throw MockError(404, '订单不存在');
  if (o.isReviewed) throw MockError(400, '订单已评价');
  const now = util.fmtTime(new Date());
  const user = store.getUser();
  (b.goodsReviews || []).forEach((gr) => {
    reviewsAll.unshift({
      id: store.nextSeq('review'),
      orderId: o.id,
      goodsId: Number(gr.goodsId),
      userId: user.id,
      userName: user.nickName,
      avatar: user.avatar,
      score: Number(gr.score || 5),
      tags: gr.tags || [],
      content: gr.content || '',
      images: gr.images || [],
      createTime: now
    });
  });
  if (b.shopReview) {
    shopReviewsAll.unshift({
      id: store.nextSeq('shopReview'),
      orderId: o.id,
      userId: user.id,
      userName: user.nickName,
      avatar: user.avatar,
      scores: b.shopReview.scores || { fresh: 5, speed: 5, package: 5 },
      content: b.shopReview.content || '',
      createTime: now
    });
  }
  // 订单标记已评价 + 积分/成长值奖励
  updateOrder(id, (x) => { x.isReviewed = true; });
  store.changePoints(20);
  store.changeGrowth(10);
  store.addPointsRecord({ type: 3, points: 20, desc: `订单 ${o.orderNo} 评价奖励`, createTime: now });
  return { success: true, points: 20 };
});

// ===== 售后工单 =====
const AFTERSALE_TYPE = { 1: '仅退款', 2: '退货退款', 3: '换货' };
const AFTERSALE_STATUS = { 1: '待处理', 2: '处理中', 3: '已完成', 4: '已取消' };
route('GET', /^\/aftersales\/page$/, (m, q) => {
  let list = store.getTickets().slice();
  if (q.status && String(q.status) !== '0') {
    list = list.filter((t) => String(t.status) === String(q.status));
  }
  list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
  return util.paginate(list.map((t) => util.clone(Object.assign(t, { statusText: AFTERSALE_STATUS[t.status] }))), q);
});
route('GET', /^\/aftersales\/(\d+)$/, (m) => {
  const t = store.findTicket(m[0]);
  if (!t) throw MockError(404, '售后工单不存在');
  return util.clone(Object.assign(t, { statusText: AFTERSALE_STATUS[t.status] }));
});
route('POST', /^\/aftersales$/, (m, q, b) => {
  const order = store.findOrder(b.orderId);
  if (!order) throw MockError(404, '订单不存在');
  if (order.status < 2 || order.status === 6) throw MockError(400, '当前订单状态不可申请售后');
  const exists = store.getTickets().some((t) => String(t.orderId) === String(order.id) && (t.status === 1 || t.status === 2));
  if (exists) throw MockError(400, '该订单已有进行中的售后申请');
  const type = Number(b.type || 1);
  let items = order.items;
  if (b.itemIds && b.itemIds.length) {
    items = order.items.filter((it) => b.itemIds.indexOf(it.goodsId) !== -1);
  }
  if (!items.length) items = order.items.slice(0, 1);
  const amount = util.round2(items.reduce((s, it) => s + it.price * it.count, 0));
  const now = new Date();
  const ticket = {
    id: store.nextSeq('aftersale'),
    orderId: order.id,
    orderNo: order.orderNo,
    type,
    typeText: AFTERSALE_TYPE[type],
    reason: b.reason || '商品问题',
    items: util.clone(items),
    amount,
    status: 1,
    statusText: AFTERSALE_STATUS[1],
    timeline: [
      { time: util.fmtTime(now), status: '提交申请', remark: `${AFTERSALE_TYPE[type]}：${b.reason || '商品问题'}` }
    ],
    rate: null,
    refundStatus: '',
    createTime: util.fmtTime(now)
  };
  const tickets = store.getTickets();
  tickets.unshift(ticket);
  store.saveTickets(tickets);
  // 联动订单 timeline + 消息
  updateOrder(order.id, (o) => pushOrderNode(o, '售后申请', `${AFTERSALE_TYPE[type]}申请已提交`));
  addMessage(2, '售后申请已提交', `订单 ${order.orderNo} 的${AFTERSALE_TYPE[type]}申请已提交，客服将尽快处理～`, order.id, 'order');
  return util.clone(ticket);
});
route('POST', /^\/aftersales\/(\d+)\/advance$/, (m) => {
  const tickets = store.getTickets();
  const t = tickets.find((x) => String(x.id) === String(m[0]));
  if (!t) throw MockError(404, '售后工单不存在');
  const now = util.fmtTime(new Date());
  if (t.status === 1) {
    t.status = 2;
    t.timeline.push({ time: now, status: '商家已受理', remark: '客服正在核实处理，请保持电话畅通' });
    addMessage(2, '售后处理中', `工单 ${t.orderNo} 商家已受理`, t.orderId, 'order');
  } else if (t.status === 2) {
    t.status = 3;
    if (t.type === 3) {
      t.timeline.push({ time: now, status: '换货完成', remark: '换货商品已发出，请注意查收' });
    } else {
      t.refundStatus = `已原路退回 ¥${util.round2(t.amount).toFixed(2)}`;
      t.timeline.push({ time: now, status: `${t.typeText}完成`, remark: t.refundStatus });
    }
    addMessage(2, '售后已完成', `工单 ${t.orderNo} 已处理完成，${t.refundStatus || '换货商品已发出'}～`, t.orderId, 'order');
  } else {
    throw MockError(400, '当前状态无需推进');
  }
  t.statusText = AFTERSALE_STATUS[t.status];
  store.saveTickets(tickets);
  return util.clone(t);
});
route('POST', /^\/aftersales\/(\d+)\/cancel$/, (m) => {
  const tickets = store.getTickets();
  const t = tickets.find((x) => String(x.id) === String(m[0]));
  if (!t) throw MockError(404, '售后工单不存在');
  if (t.status >= 3) throw MockError(400, '工单已结束，不可取消');
  t.status = 4;
  t.statusText = AFTERSALE_STATUS[4];
  t.timeline.push({ time: util.fmtTime(new Date()), status: '已取消', remark: '用户主动撤销售后申请' });
  store.saveTickets(tickets);
  return util.clone(t);
});
route('POST', /^\/aftersales\/(\d+)\/rate$/, (m, q, b) => {
  const tickets = store.getTickets();
  const t = tickets.find((x) => String(x.id) === String(m[0]));
  if (!t) throw MockError(404, '售后工单不存在');
  if (t.status !== 3) throw MockError(400, '工单完成后才可评价');
  t.rate = {
    speed: Number(b.speed || 5),
    solve: Number(b.solve || 5),
    content: b.content || ''
  };
  t.timeline.push({ time: util.fmtTime(new Date()), status: '客服评价已提交', remark: `响应速度 ${t.rate.speed} 星 · 问题解决 ${t.rate.solve} 星` });
  store.saveTickets(tickets);
  store.changePoints(5);
  store.addPointsRecord({ type: 3, points: 5, desc: '客服评价奖励积分', createTime: util.fmtTime(new Date()) });
  return { success: true, points: 5 };
});

// ===== 客服 =====
route('POST', /^\/service\/rate$/, (m, q, b) => {
  store.changePoints(5);
  store.addPointsRecord({ type: 3, points: 5, desc: '客服评价奖励积分', createTime: util.fmtTime(new Date()) });
  addMessage(1, '感谢评价', '感谢您对客服服务的评价，5 积分已到账～', 0, '');
  return { success: true, points: 5, speed: Number(b.speed || 5), solve: Number(b.solve || 5) };
});

// ===== 会员 =====
route('GET', /^\/member\/info$/, () => {
  const u = store.getUser();
  const level = getLevelByGrowth(u.growthValue);
  const next = getNextLevel(level.level);
  return {
    user: util.clone(u),
    level,
    nextLevel: next ? { name: next.name, minGrowth: next.minGrowth } : null,
    growthPercent: next
      ? Math.min(100, Math.round((u.growthValue - level.minGrowth) / (next.minGrowth - level.minGrowth) * 100))
      : 100,
    levels: util.clone(levels),
    couponCount: store.getMyCoupons().filter((c) => c.status === 1).length,
    collectCount: store.getCollects().length
  };
});

route('PUT', /^\/user$/, (m, q, b) => store.setUser(b));

// 生日福利（生日月可领：200 积分 + 5 元无门槛券）
route('POST', /^\/member\/birthday-gift$/, () => {
  const user = store.getUser();
  const birthMonth = Number(String(user.birthday).slice(5, 7));
  const nowMonth = new Date().getMonth() + 1;
  if (birthMonth !== nowMonth) throw MockError(400, '生日礼包仅在生日月可领取');
  const coupons = store.getMyCoupons();
  if (coupons.some((c) => c.source === '生日赠送' && c.templateId === 5)) {
    throw MockError(400, '今年的生日礼包已领取');
  }
  const tpl = couponTemplates.find((t) => t.id === 5);
  coupons.unshift(Object.assign({}, tpl, {
    id: store.nextSeq('coupon'),
    templateId: 5,
    status: 1,
    source: '生日赠送',
    receiveTime: util.fmtTime(new Date()),
    expireTime: util.fmtDate(new Date(Date.now() + 30 * 86400000))
  }));
  store.saveMyCoupons(coupons);
  store.changePoints(200);
  store.addPointsRecord({
    type: 5, points: 200, desc: '生日礼包赠送积分', createTime: util.fmtTime(new Date())
  });
  return { success: true, points: 200, coupon: '5 元无门槛券' };
});
route('POST', /^\/user\/logout$/, () => {
  store.reset();
  return { success: true };
});

// ===== 积分 =====
route('GET', /^\/points\/records\/page$/, (m, q) => {
  const list = store.getPointsRecords().map((r) => {
    const typeText = { 1: '购物奖励', 2: '签到', 3: '评价奖励', 4: '积分兑换', 5: '生日赠送' }[r.type] || '其他';
    return Object.assign({}, r, { typeText });
  });
  return util.paginate(list, q);
});
route('GET', /^\/points\/exchange$/, () => util.clone(exchangeItems));
route('POST', /^\/points\/exchange$/, (m, q, b) => {
  const item = exchangeItems.find((x) => x.id === Number(b.id));
  if (!item) throw MockError(404, '兑换项不存在');
  const u = store.getUser();
  if (u.points < item.points) throw MockError(400, '积分不足，再攒攒吧');
  store.changePoints(-item.points);
  store.addPointsRecord({
    type: 4, points: -item.points, desc: `积分兑换「${item.name}」`,
    createTime: util.fmtTime(new Date())
  });
  if (item.type === 'coupon') {
    const tpl = couponTemplates.find((t) => t.id === item.couponTemplateId);
    const coupons = store.getMyCoupons();
    coupons.unshift(Object.assign({}, tpl, {
      id: store.nextSeq('coupon'),
      templateId: tpl.id,
      status: 1,
      source: '积分兑换',
      receiveTime: util.fmtTime(new Date()),
      expireTime: util.fmtDate(new Date(Date.now() + 7 * 86400000))
    }));
    store.saveMyCoupons(coupons);
  }
  return { success: true, points: store.getUser().points };
});

// ===== 签到 =====
route('GET', /^\/checkin$/, () => {
  const state = store.getCheckin();
  const d = new Date();
  return {
    today: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    continuousDays: state.continuousDays,
    todaySigned: state.todaySigned,
    monthRecords: state.monthRecords,
    rewards: checkinRewards,
    rules: checkinRules,
    tomorrowReward: checkinRewards[state.continuousDays % 7]
  };
});
route('POST', /^\/checkin$/, () => {
  const state = store.getCheckin();
  if (state.todaySigned) throw MockError(400, '今日已签到，明天再来吧');
  const d = new Date();
  state.todaySigned = true;
  state.monthRecords.push(d.getDate());
  state.continuousDays += 1;
  const reward = checkinRewards[(state.continuousDays - 1) % 7];
  store.saveCheckin(state);
  store.changePoints(reward);
  store.addPointsRecord({
    type: 2, points: reward,
    desc: state.continuousDays % 7 === 0 ? `连续签到第 7 天大奖` : `每日签到（连签 ${state.continuousDays} 天）`,
    createTime: util.fmtTime(new Date())
  });
  return { success: true, reward, continuousDays: state.continuousDays, points: store.getUser().points };
});

// ===== 优惠券 =====
route('GET', /^\/coupons\/templates$/, () => {
  const mine = store.getMyCoupons();
  return couponTemplates.map((t) => {
    const received = mine.some((c) => c.templateId === t.id && c.status === 1);
    return Object.assign({}, t, { received });
  });
});
route('POST', /^\/coupons\/receive$/, (m, q, b) => {
  const tpl = couponTemplates.find((t) => t.id === Number(b.id));
  if (!tpl) throw MockError(404, '优惠券不存在');
  const coupons = store.getMyCoupons();
  if (coupons.some((c) => c.templateId === tpl.id && c.status === 1)) {
    throw MockError(400, '已经领取过啦');
  }
  const daysMap = { 1: 7, 2: 7, 3: 15, 4: 5, 5: 3, 6: 7 };
  coupons.unshift(Object.assign({}, tpl, {
    id: store.nextSeq('coupon'),
    templateId: tpl.id,
    status: 1,
    source: '领取',
    receiveTime: util.fmtTime(new Date()),
    expireTime: util.fmtDate(new Date(Date.now() + (daysMap[tpl.id] || 7) * 86400000))
  }));
  store.saveMyCoupons(coupons);
  addMessage(3, '领券成功', `您已领取「${tpl.name}」，下单时自动按最优组合使用～`, 0, 'coupon');
  return { success: true };
});
route('GET', /^\/coupons\/mine$/, (m, q) => {
  let list = store.getMyCoupons();
  if (q.status) list = list.filter((c) => String(c.status) === String(q.status));
  return util.clone(list.sort((a, b) => a.status - b.status));
});

// ===== 促销（场次） / 团购 =====
route('GET', /^\/promotions$/, () => ({
  sessions: buildSessions(goodsAll),
  fullReduceRules: util.clone(fullReduceRules),
  wholesale: buildWholesale(goodsAll)
}));
// 限时抢购：立即抢购（加入购物车抢购价）或立即下单
route('POST', /^\/promotions\/seckill\/buy$/, (m, q, b) => {
  const sessions = buildSessions(goodsAll);
  const session = sessions.find((s) => String(s.id) === String(b.sessionId)) || sessions.find((s) => s.status === 1);
  if (!session || session.status !== 1) throw MockError(400, '该场次未在抢购时间内');
  const goods = session.goods.find((x) => x.goodsId === Number(b.goodsId));
  if (!goods) throw MockError(404, '抢购商品不存在');
  const count = Math.min(Number(b.count || 1), 5);
  if (goods.soldPercent >= 100) throw MockError(400, '手慢了，已被抢光');
  goods.soldPercent = Math.min(100, goods.soldPercent + count * 3);
  const specText = `限时抢购价 · ${session.name}`;
  if (b.mode === 'buy') {
    const g = findGoods(goods.goodsId);
    return {
      buyNow: [{
        goodsId: g.id, name: g.name, pic: g.pic, specText,
        price: goods.seckillPrice, count
      }]
    };
  }
  const list = store.getCart();
  const exist = list.find((it) => !it.invalid && it.goodsId === goods.goodsId && it.specText === specText);
  if (exist) exist.count = Math.min(exist.stock, exist.count + count);
  else {
    list.push({
      id: store.nextSeq('cart'),
      goodsId: goods.goodsId,
      name: goods.name,
      pic: goods.pic,
      specText,
      price: goods.seckillPrice,
      count,
      checked: true,
      stock: goods.stock,
      invalid: false
    });
  }
  store.saveCart(list);
  addMessage(3, '抢购成功', `您已按抢购价 ¥${goods.seckillPrice} 加入「${goods.name}」，请尽快结算～`, goods.goodsId, 'goods');
  return util.clone(list);
});
// 团购批发阶梯价加购
route('POST', /^\/promotions\/wholesale\/buy$/, (m, q, b) => {
  const wholesale = buildWholesale(goodsAll);
  const w = wholesale.find((x) => x.id === Number(b.id));
  if (!w) throw MockError(404, '批发活动不存在');
  const ladder = (w.ladder || []).filter((l) => Number(b.count) >= l.count)
    .sort((a, b2) => b2.count - a.count)[0];
  if (!ladder) throw MockError(400, `该商品 ${w.ladder[0].count} 件起批`);
  const g = findGoods(w.goodsId);
  const specText = `团购批发 ${b.count} 件（¥${ladder.price}/件）`;
  const list = store.getCart();
  const exist = list.find((it) => !it.invalid && it.goodsId === w.goodsId && it.specText === specText);
  if (exist) exist.count += Number(b.count);
  else {
    list.push({
      id: store.nextSeq('cart'),
      goodsId: w.goodsId, name: w.title.replace(/ ·.*/, ''), pic: w.pic, specText,
      price: ladder.price, count: Number(b.count), checked: true, stock: g.stock, invalid: false
    });
  }
  store.saveCart(list);
  return util.clone(list);
});

// ===== 拼团 =====
let activeGroups = buildGroups(goodsAll);
function findActiveGroup(id) {
  return activeGroups.find((x) => x.id === Number(id));
}
function syncMyGroup(group) {
  const mine = store.getMyGroups();
  const idx = mine.findIndex((x) => x.id === group.id);
  if (idx === -1) mine.unshift(util.clone(group));
  else mine[idx] = util.clone(group);
  wx.setStorageSync(store.KEY.GROUP, mine);
}
// 成团后生成拼团订单（已支付，待发货）
function completeGroup(group, specText, count) {
  const now = new Date();
  const me = store.getUser();
  const g = findGoods(group.goodsId) || {};
  const qty = count || 1;
  const order = {
    id: store.nextSeq('order'),
    orderNo: util.genOrderNo(),
    status: 2,
    statusText: STATUS_TEXT[2],
    items: [{
      goodsId: group.goodsId, name: group.name, pic: group.pic,
      specText: specText || '拼团专享价', price: group.groupPrice, count: qty
    }],
    totalAmount: util.round2(group.groupPrice * qty),
    discountAmount: util.round2((group.originalPrice - group.groupPrice) * qty),
    freight: 0,
    payAmount: util.round2(group.groupPrice * qty),
    couponId: 0, couponTitle: '', payType: 1,
    remark: `拼团订单（${group.requiredCount}人团）`,
    deliveryDate: util.fmtDate(now),
    deliverySlot: '尽快送达（预计45分钟）',
    addressSnapshot: { name: '张小馋', phone: '138****8888', address: '上海市浦东新区博云路 2 号' },
    rider: null,
    timeline: [
      { time: util.fmtTime(new Date(now.getTime() - 600000)), status: '拼团成功', remark: `${group.requiredCount} 人已成团` },
      { time: util.fmtTime(now), status: '支付成功', remark: '微信支付（演示环境，不产生真实交易），商家备货中' }
    ],
    isReviewed: false,
    createTime: util.fmtTime(now)
  };
  const list = store.getOrders();
  list.unshift(order);
  store.saveOrders(list);
  return order;
}
route('GET', /^\/groups$/, () => activeGroups.filter((g) => g.status === 1).map(util.clone));
route('GET', /^\/groups\/mine$/, () => {
  // 用内存中的最新拼团状态覆盖 storage 快照
  return store.getMyGroups().map((mg) => {
    const live = activeGroups.find((x) => x.id === mg.id);
    return live ? util.clone(live) : util.clone(mg);
  });
});
route('GET', /^\/groups\/(\d+)$/, (m) => {
  const id = Number(m[0]);
  const g = findActiveGroup(id) || store.getMyGroups().find((x) => x.id === id);
  if (!g) throw MockError(404, '拼团不存在');
  return util.clone(g);
});
// 一键开团
route('POST', /^\/groups\/open$/, (m, q, b) => {
  const g = findGoods(b.goodsId);
  if (!g) throw MockError(404, '商品不存在');
  const me = store.getUser();
  const group = {
    id: store.nextSeq('group'),
    goodsId: g.id,
    name: g.name,
    pic: g.pic,
    groupPrice: util.round2((b.price || g.price * 0.8)),
    originalPrice: g.price,
    requiredCount: Number(b.requiredCount || 3),
    joinedCount: 1,
    remainCount: (b.requiredCount || 3) - 1,
    status: 1,
    leaderId: me.id,
    members: [{ userId: me.id, name: me.nickName + '（团长）', avatar: me.avatar, isLeader: true }],
    endTime: util.fmtTime(new Date(Date.now() + 24 * 3600000)),
    leftSeconds: 24 * 3600,
    rules: '3 人成团享拼团价，24 小时未成团自动退款',
    myJoined: true,
    specText: b.specText || '拼团专享价',
    count: Number(b.count || 1)
  };
  activeGroups.unshift(group);
  syncMyGroup(group);
  addMessage(1, '开团成功', `你发起的「${g.name}」拼团已创建，快邀请好友参团吧～`, g.id, 'group');
  return util.clone(group);
});
function joinGroupImpl(id, b, fakeMember) {
  const group = findActiveGroup(id);
  if (!group) throw MockError(404, '拼团不存在');
  if (group.status !== 1) throw MockError(400, group.status === 2 ? '该团已成团' : '该团已结束');
  if (group.joinedCount >= group.requiredCount) throw MockError(400, '该团已成团');
  if (!fakeMember) {
    const me = store.getUser();
    group.members.push({ userId: me.id, name: me.nickName, avatar: me.avatar, isLeader: false });
  } else {
    const ai = 1 + (group.members.length % 6);
    group.members.push({
      userId: 20000 + ai,
      name: fakeMember.name,
      avatar: `/static/mock/avatar${ai}.jpg`,
      isLeader: false
    });
  }
  group.joinedCount += 1;
  group.remainCount = group.requiredCount - group.joinedCount;
  let order = null;
  if (group.joinedCount >= group.requiredCount) {
    group.status = 2;
    group.remainCount = 0;
    order = completeGroup(group, b && b.specText, b && b.count);
    addMessage(1, '拼团成功', `您参与的「${group.name}」已成团，商品将尽快发出～`, order.id, 'order');
  }
  group.myJoined = true;
  syncMyGroup(group);
  return { group: util.clone(group), order: order ? util.clone(order) : null };
}
route('POST', /^\/groups\/(\d+)\/join$/, (m, q, b) => joinGroupImpl(m[0], b || {}, null));
// 模拟好友参团（演示邀请效果/成团）
route('POST', /^\/groups\/(\d+)\/simulate$/, (m, q, b) => {
  const names = ['乐乐', 'Amy', '零食收割机', '小馋猫', '坚果达人'];
  const name = names[groupRnd() % names.length];
  return joinGroupImpl(m[0], b || {}, { name });
});
function groupRnd() { return Math.floor(Math.random() * 100); }

// 分享裂变奖励：商品/拼团分享 +5 积分，每日上限 3 次
route('POST', /^\/share\/reward$/, (m, q, b) => {
  const today = util.fmtDate(new Date());
  const counter = store.getShareCounter();
  const used = counter[today] || 0;
  if (used >= 3) return { awarded: false, points: 0, reason: '今日分享奖励已达上限（3 次）' };
  store.bumpShareCounter(today);
  const pts = 5;
  store.changePoints(pts);
  store.addPointsRecord({ type: 2, points: pts, desc: b.type === 'group' ? '分享拼团奖励积分' : '分享商品奖励积分', createTime: util.fmtTime(new Date()) });
  return { awarded: true, points: pts, remainTimes: 3 - used - 1 };
});
// 邀请新用户奖励：每用户仅一次 → 50 积分 + 满59减8券
route('POST', /^\/invite\/reward$/, () => {
  if (store.isInviteRewarded()) throw MockError(400, '邀新奖励已领取过');
  store.markInviteRewarded();
  store.changePoints(50);
  store.addPointsRecord({ type: 5, points: 50, desc: '邀请新用户奖励积分', createTime: util.fmtTime(new Date()) });
  const tpl = couponTemplates.find((t) => t.id === 1);
  const coupons = store.getMyCoupons();
  coupons.unshift(Object.assign({}, tpl, {
    id: store.nextSeq('coupon'), templateId: 1, status: 1, source: '邀新奖励',
    receiveTime: util.fmtTime(new Date()),
    expireTime: util.fmtDate(new Date(Date.now() + 7 * 86400000))
  }));
  store.saveMyCoupons(coupons);
  addMessage(1, '邀请奖励', '好友通过你的分享注册成功，50 积分与「满59减8」优惠券已到账～', 0, 'coupon');
  return { success: true, points: 50, coupon: tpl.name };
});

// ===== 消息（storage 持久化）=====
route('GET', /^\/messages$/, (m, q) => {
  let list = store.getMessages().map(util.clone);
  if (q.type && String(q.type) !== '0') list = list.filter((x) => String(x.type) === String(q.type));
  return { records: list, unreadCount: store.unreadMessageCount() };
});
route('POST', /^\/messages\/read$/, (m, q, b) => {
  store.markMessageRead(b.id);
  return { success: true, unreadCount: store.unreadMessageCount() };
});

// ===== 店铺 =====
route('GET', /^\/shop\/info$/, () => util.clone(shop));

// ===== 收藏 / 足迹 =====
route('GET', /^\/collects\/page$/, (m, q) => {
  const ids = store.getCollects();
  const list = ids.map(findGoods).filter(Boolean).map(decorateGoods);
  return util.paginate(list, q);
});
route('POST', /^\/collects\/toggle$/, (m, q, b) => {
  const collected = store.toggleCollect(b.goodsId);
  return { collected, isCollect: collected };
});
route('GET', /^\/footprints\/page$/, (m, q) => {
  const rows = store.getFootprints().map((f) => {
    const g = findGoods(f.goodsId);
    return g ? Object.assign(decorateGoods(g), { footprintTime: f.time }) : null;
  }).filter(Boolean);
  // 按日期分组
  const groupsMap = [];
  rows.forEach((r) => {
    let g = groupsMap.find((x) => x.date === r.footprintTime);
    if (!g) { g = { date: r.footprintTime, records: [] }; groupsMap.push(g); }
    g.records.push(r);
  });
  return { groups: groupsMap, total: rows.length };
});
route('POST', /^\/footprints\/add$/, (m, q, b) => {
  store.addFootprint(b.goodsId);
  return { success: true };
});
route('POST', /^\/footprints\/clear$/, () => {
  store.clearFootprints();
  return { success: true };
});

// ===== 上传（mock）=====
route('POST', /^\/upload$/, () => ({ url: '/static/mock/u01.jpg' }));

// ---- 分发 ----
function dispatch(url, method, data) {
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) url = url.slice(0, hashIdx);
  const qIdx = url.indexOf('?');
  const path = (qIdx === -1 ? url : url.slice(0, qIdx)).replace(/^\/api\/mock/, '');
  const query = parseQuery(qIdx === -1 ? '' : url.slice(qIdx + 1));
  if (method === 'GET' && data) Object.assign(query, data);
  for (const [rm, re, fn] of routes) {
    if (rm !== method) continue;
    const mm = path.match(re);
    if (mm) {
      try {
        const payload = fn(mm.slice(1), query, data || {});
        return Promise.resolve(payload).then((p) =>
          delay({ code: 200, data: p === undefined ? null : p, msg: 'ok' })
        ).catch((err) => delay({
          code: (err && err.code) || 400,
          data: null,
          msg: (err && err.message) || '操作失败'
        }, 100));
      } catch (err) {
        return delay({
          code: err.code || 400,
          data: null,
          msg: err.message || '操作失败'
        }, 100);
      }
    }
  }
  return delay({ code: 404, data: null, msg: `Mock 接口不存在：${method} ${path}` }, 100);
}

module.exports = {
  dispatch,
  STATUS_TEXT
};
