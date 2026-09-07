// mock/index.js —— Mock 总入口：API 路由分发（url + method 匹配）
// 写操作在内存中真实生效，并通过 wx.setStorageSync 持久化，跨页面数据一致

const delay = require('./delay.js');
const goodsSeed = require('./data/goods.js');
const categories = require('./data/categories.js');
const cartsSeed = require('./data/carts.js');
const addressesSeed = require('./data/addresses.js');
const ordersSeed = require('./data/orders.js');
const reviewsSeed = require('./data/reviews.js');
const shopReviewsSeed = require('./data/shopReviews.js');
const membersData = require('./data/members.js');
const pointsSeed = require('./data/points.js');
const checkinData = require('./data/checkin.js');
const couponsData = require('./data/coupons.js');
const promotionsData = require('./data/promotions.js');
const groupsData = require('./data/groups.js');
const messagesSeed = require('./data/messages.js');
const userSeed = require('./data/user.js');
const shop = require('./data/shop.js');
const serviceData = require('./data/service.js');

const { formatDate } = require('../utils/format.js');

// ---------------- 内存数据库（storage 持久化） ----------------
const KEYS = {
  carts: 'mock_carts',
  addresses: 'mock_addresses',
  orders: 'mock_orders',
  coupons: 'mock_coupons',
  points: 'mock_points_records',
  checkin: 'mock_checkin',
  messages: 'mock_messages',
  collects: 'mock_collects',
  footprints: 'mock_footprints',
  groups: 'mock_groups',
  mygroups: 'mock_mygroups',
  aftersales: 'mock_aftersales'
};

function load(key, seed) {
  let data = null;
  try { data = wx.getStorageSync(KEYS[key]); } catch (e) {}
  if (data === null || data === '' || data === undefined) {
    data = JSON.parse(JSON.stringify(seed));
    try { wx.setStorageSync(KEYS[key], data); } catch (e) {}
  }
  return data;
}

const db = {
  carts: load('carts', cartsSeed),
  addresses: load('addresses', addressesSeed),
  orders: load('orders', ordersSeed),
  coupons: load('coupons', couponsData.mine),
  points: load('points', pointsSeed),
  checkin: load('checkin', { continuousDays: 3, todaySigned: false, monthRecords: [], lastSignDate: '' }),
  messages: load('messages', messagesSeed),
  collects: load('collects', []),
  footprints: load('footprints', []),
  groups: load('groups', groupsData.groups),
  mygroups: load('mygroups', []), // [{ groupId, orderId, isLeader, joinedAt }]
  aftersales: load('aftersales', [])
};

// 静态数据（评价允许追加，持久化在 extra key）
let reviews = reviewsSeed.slice();
let shopReviews = shopReviewsSeed.slice();
try {
  const extraR = wx.getStorageSync('mock_reviews_extra') || [];
  reviews = extraR.concat(reviewsSeed);
  const extraS = wx.getStorageSync('mock_shopreviews_extra') || [];
  shopReviews = extraS.concat(shopReviewsSeed);
} catch (e) {}

function persist(key) {
  try { wx.setStorageSync(KEYS[key], db[key]); } catch (e) {}
}

function getUser() {
  let u = null;
  try { u = wx.getStorageSync('userInfo'); } catch (e) {}
  return u || userSeed;
}

function saveUser(u) {
  try { wx.setStorageSync('userInfo', u); } catch (e) {}
}

function nextId(list) {
  return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
}

function nowStr() {
  return formatDate(new Date(), 'YYYY-MM-DD HH:mm');
}

function todayStr() {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

function paginate(list, current, size) {
  current = Number(current) || 1;
  size = Number(size) || 10;
  const start = (current - 1) * size;
  return {
    records: list.slice(start, start + size),
    total: list.length,
    current,
    size
  };
}

function addPoints(points, type, desc) {
  const rec = { id: nextId(db.points), type, points, desc, createTime: nowStr() };
  db.points.unshift(rec);
  persist('points');
  const u = getUser();
  u.points = (u.points || 0) + points;
  saveUser(u);
  return rec;
}

function addMessage(type, title, content, relatedId, relatedType) {
  db.messages.unshift({ id: nextId(db.messages), type, title, content, isRead: false, createTime: nowStr(), relatedId: relatedId || null, relatedType: relatedType || null });
  persist('messages');
}

// 配送费计算：起步 5 元含 3km，超出 1 元/km；会员/满额免基础配送费
function calcFreight(amount, distanceKm) {
  const rule = shop.deliveryRule;
  const u = getUser();
  const lv = membersData.levels.find(l => l.level === (u.level || 1)) || membersData.levels[0];
  const threshold = Math.min(rule.freeThreshold, lv.freeDeliveryThreshold);
  if (amount >= threshold) return 0;
  const extra = Math.max(0, Math.ceil((distanceKm || 1) - rule.baseKm)) * rule.perKmFee;
  return rule.baseFee + extra;
}

// 优惠券抵扣金额
function couponReduce(coupon, amount) {
  if (!coupon) return 0;
  if (coupon.type === 2) { // 折扣券，88 => 8.8 折
    return Math.round(amount * (100 - coupon.discount)) / 100;
  }
  return Math.min(coupon.discount, amount);
}

// ---------------- 路由表 ----------------
const routes = {};
function route(method, url, handler) {
  routes[method + ' ' + url] = handler;
}

// ===== 首页 =====
route('GET', '/home/banners', () => ([
  { id: 1, img: '/static/mock/banner1.png', title: '零食狂欢节', desc: '全场满 59 免配送费', link: '/pages/classic/classic', linkType: 'tab' },
  { id: 2, img: '/static/mock/banner2.png', title: '新品上市', desc: '当季爆款 第二件半价', link: '/pages/list/list?theme=2', linkType: 'page' },
  { id: 3, img: '/static/mock/banner3.png', title: '会员专享日', desc: '金卡会员 92 折起', link: '/pages/member/center', linkType: 'page' }
]));

route('GET', '/home/themes', () => ([
  { id: 1, name: '人气爆款', description: '大家都在买', img: '/static/mock/theme1.png', goodsIds: [1, 25, 17, 9, 22, 13, 29, 18] },
  { id: 2, name: '新品首发', description: '尝鲜趁现在', img: '/static/mock/theme2.png', goodsIds: [3, 28, 30, 19, 23, 12, 26, 15] },
  { id: 3, name: '进口优选', description: '环球风味集', img: '/static/mock/theme3.png', goodsIds: [27, 28, 29, 30, 5, 13] }
]));

// ===== 商品 =====
route('GET', '/goods/list', (q) => {
  let list = goodsSeed.slice();
  if (q.ids) {
    const ids = String(q.ids).split(',').map(Number);
    list = list.filter(g => ids.indexOf(g.id) > -1);
    // 按 ids 顺序
    list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  }
  if (q.keywords) {
    const kw = String(q.keywords).trim();
    list = list.filter(g => g.name.indexOf(kw) > -1 || g.tags.join('').indexOf(kw) > -1 || g.categoryName.indexOf(kw) > -1);
  }
  if (q.categoryId && Number(q.categoryId) > 0) {
    list = list.filter(g => g.categoryId === Number(q.categoryId));
  }
  if (q.priceRange) {
    const range = String(q.priceRange);
    if (range === '200+') list = list.filter(g => g.minPrice >= 200);
    else {
      const parts = range.split('-').map(Number);
      list = list.filter(g => g.minPrice >= parts[0] && g.minPrice < parts[1]);
    }
  }
  if (q.origins) {
    const os = String(q.origins).split(',');
    list = list.filter(g => os.indexOf(g.origin) > -1);
  }
  if (q.inStock === '1' || q.inStock === 1) {
    list = list.filter(g => g.stock > 0);
  }
  if (q.ids) {
    // ids 模式保持传入顺序，不再参与排序
    return paginate(list, q.current, q.size);
  }
  switch (q.sort) {
    case 'price_asc': list.sort((a, b) => a.minPrice - b.minPrice); break;
    case 'price_desc': list.sort((a, b) => b.minPrice - a.minPrice); break;
    case 'sales': list.sort((a, b) => b.numberSells - a.numberSells); break;
    default: list.sort((a, b) => b.hotScore - a.hotScore);
  }
  return paginate(list, q.current, q.size);
});

route('GET', '/goods/detail', (q) => {
  const g = goodsSeed.find(x => x.id === Number(q.id));
  if (!g) throw new Error('商品不存在或已下架');
  g.viewCount += 1;
  // 写浏览足迹（去重置顶，上限 100 条）
  db.footprints = db.footprints.filter(f => f.goodsId !== g.id);
  db.footprints.unshift({ goodsId: g.id, time: nowStr(), ts: Date.now() });
  if (db.footprints.length > 100) db.footprints.length = 100;
  persist('footprints');
  const detail = JSON.parse(JSON.stringify(g));
  detail.isCollect = db.collects.indexOf(g.id) > -1;
  return detail;
});

route('GET', '/goods/recommend', (q) => {
  const g = goodsSeed.find(x => x.id === Number(q.goodsId));
  const size = Number(q.size) || 6;
  let list = goodsSeed.filter(x => !g || x.id !== g.id);
  if (g) {
    const same = list.filter(x => x.categoryId === g.categoryId);
    const other = list.filter(x => x.categoryId !== g.categoryId);
    list = same.concat(other);
  }
  list.sort((a, b) => b.numberSells - a.numberSells);
  return list.slice(0, size);
});

// ===== 搜索 =====
route('GET', '/search/hot', () => ['薯片', '每日坚果', '0糖气泡水', '牛肉干', '黄油曲奇', '进口零食', '大礼包', '低卡']);
route('GET', '/search/suggest', (q) => {
  const kw = String(q.keywords || '').trim();
  if (!kw) return [];
  return goodsSeed
    .filter(g => g.name.indexOf(kw) > -1 || g.categoryName.indexOf(kw) > -1)
    .slice(0, 8)
    .map(g => ({ id: g.id, name: g.name }));
});

// ===== 分类 =====
route('GET', '/category/list', () => categories);

// ===== 购物车 =====
route('GET', '/cart/list', () => {
  const valid = db.carts.filter(c => !c.invalid);
  const invalid = db.carts.filter(c => c.invalid);
  return { valid, invalid, all: db.carts };
});

route('POST', '/cart/add', (b) => {
  const goodsId = Number(b.goodsId);
  const g = goodsSeed.find(x => x.id === goodsId);
  if (!g) throw new Error('商品不存在');
  const specText = b.specText || (g.specs[0].values[0].label + ' · ' + g.specs[1].values[0].label);
  const count = Math.max(1, Number(b.count) || 1);
  const exist = db.carts.find(c => c.goodsId === goodsId && c.specText === specText && !c.invalid);
  if (exist) {
    exist.count = Math.min(exist.count + count, exist.stock || 999);
  } else {
    db.carts.push({
      id: nextId(db.carts),
      goodsId,
      name: g.name,
      pic: b.pic || g.pic,
      specText,
      price: Number(b.price) || g.minPrice,
      count,
      checked: true,
      stock: Number(b.stock) || g.stock,
      invalid: false
    });
  }
  persist('carts');
  return { cartCount: db.carts.filter(c => !c.invalid).reduce((s, c) => s + c.count, 0) };
});

route('POST', '/cart/update', (b) => {
  const item = db.carts.find(c => c.id === Number(b.id));
  if (!item) throw new Error('购物车商品不存在');
  if (b.count != null) item.count = Math.max(1, Math.min(Number(b.count), item.stock || 999));
  if (b.checked != null) item.checked = !!b.checked;
  persist('carts');
  return item;
});

route('POST', '/cart/checkAll', (b) => {
  db.carts.forEach(c => { if (!c.invalid) c.checked = !!b.checked; });
  persist('carts');
  return { checked: !!b.checked };
});

route('POST', '/cart/delete', (b) => {
  const ids = (b.ids || []).map(Number);
  db.carts = db.carts.filter(c => ids.indexOf(c.id) === -1);
  persist('carts');
  return { deleted: ids.length };
});

route('POST', '/cart/clearInvalid', () => {
  const n = db.carts.filter(c => c.invalid).length;
  db.carts = db.carts.filter(c => !c.invalid);
  persist('carts');
  return { cleared: n };
});

route('GET', '/cart/count', () => db.carts.filter(c => !c.invalid).reduce((s, c) => s + c.count, 0));

// ===== 地址 =====
route('GET', '/address/list', () => db.addresses);

route('POST', '/address/save', (b) => {
  if (b.isDefault) db.addresses.forEach(a => { a.isDefault = false; });
  if (b.id) {
    const a = db.addresses.find(x => x.id === Number(b.id));
    if (!a) throw new Error('地址不存在');
    Object.assign(a, b, { id: a.id, isDefault: !!b.isDefault });
    persist('addresses');
    return a;
  }
  const item = {
    id: nextId(db.addresses),
    name: b.name, phone: b.phone,
    province: b.province, city: b.city, district: b.district,
    detail: b.detail, tag: b.tag || '家',
    isDefault: !!b.isDefault || db.addresses.length === 0,
    distanceKm: b.distanceKm != null ? Number(b.distanceKm) : Math.round((0.5 + Math.random() * 6) * 10) / 10
  };
  db.addresses.push(item);
  persist('addresses');
  return item;
});

route('POST', '/address/delete', (b) => {
  db.addresses = db.addresses.filter(a => a.id !== Number(b.id));
  if (db.addresses.length && !db.addresses.some(a => a.isDefault)) db.addresses[0].isDefault = true;
  persist('addresses');
  return { ok: true };
});

route('POST', '/address/default', (b) => {
  db.addresses.forEach(a => { a.isDefault = a.id === Number(b.id); });
  persist('addresses');
  return { ok: true };
});

// ===== 订单 =====
route('GET', '/order/list', (q) => {
  let list = db.orders.slice().sort((a, b) => (b.createdTs || b.id) - (a.createdTs || a.id));
  const status = Number(q.status) || 0;
  if (status > 0) {
    if (status === 7) list = list.filter(o => o.status === 5 && !o.isReviewed); // 待评价
    else list = list.filter(o => o.status === status);
  }
  return paginate(list, q.current, q.size);
});

route('GET', '/order/detail', (q) => {
  const o = db.orders.find(x => x.id === Number(q.id));
  if (!o) throw new Error('订单不存在');
  return o;
});

route('GET', '/order/statusCount', () => {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 7: 0 };
  db.orders.forEach(o => {
    if (c[o.status] != null) c[o.status] += 1;
    if (o.status === 5 && !o.isReviewed) c[7] += 1;
  });
  return c;
});

// 结算预览：根据商品 + 地址 + 优惠券试算金额（不落库）
route('GET', '/order/preview', (q) => {
  const items = (q.items || []).map(it => {
    const g = goodsSeed.find(x => x.id === Number(it.goodsId));
    if (!g) throw new Error('商品不存在：' + it.goodsId);
    return { goodsId: g.id, name: g.name, pic: g.pic, specText: it.specText || g.specs[0].values[0].label, price: Number(it.price) || g.minPrice, count: Math.max(1, Number(it.count) || 1) };
  });
  const totalAmount = Math.round(items.reduce((s, it) => s + it.price * it.count, 0) * 100) / 100;
  let discountAmount = 0;
  if (q.couponId) {
    const cp = db.coupons.find(c => c.id === Number(q.couponId) && c.status === 1);
    if (cp && totalAmount >= cp.threshold) discountAmount = couponReduce(cp, totalAmount);
  }
  const addr = db.addresses.find(a => a.id === Number(q.addressId)) || db.addresses.find(a => a.isDefault) || db.addresses[0];
  const outOfRange = addr ? (addr.distanceKm || 0) > shop.deliveryRule.maxKm : false;
  const freight = outOfRange ? shop.deliveryRule.baseFee : calcFreight(totalAmount - discountAmount, addr ? addr.distanceKm : 1);
  return {
    items, totalAmount, discountAmount, freight,
    payAmount: Math.round((totalAmount - discountAmount + freight) * 100) / 100,
    outOfRange,
    maxKm: shop.deliveryRule.maxKm,
    freeThreshold: Math.min(shop.deliveryRule.freeThreshold, (membersData.levels.find(l => l.level === (getUser().level || 1)) || membersData.levels[0]).freeDeliveryThreshold)
  };
});

route('POST', '/order/create', (b) => {
  const items = (b.items || []).map(it => {
    const g = goodsSeed.find(x => x.id === Number(it.goodsId));
    if (!g) throw new Error('商品不存在：' + it.goodsId);
    return {
      goodsId: g.id,
      name: g.name,
      pic: g.pic,
      specText: it.specText || g.specs[0].values[0].label,
      price: Number(it.price) || g.minPrice,
      count: Math.max(1, Number(it.count) || 1)
    };
  });
  if (!items.length) throw new Error('订单商品为空');
  const addr = db.addresses.find(a => a.id === Number(b.addressId)) || db.addresses.find(a => a.isDefault) || db.addresses[0];
  if (!addr) throw new Error('请先添加收货地址');
  if ((addr.distanceKm || 0) > shop.deliveryRule.maxKm) throw new Error('该地址暂不支持配送（超出 ' + shop.deliveryRule.maxKm + 'km 配送范围）');

  const totalAmount = Math.round(items.reduce((s, it) => s + it.price * it.count, 0) * 100) / 100;
  // 优惠券
  let discountAmount = 0, couponTitle = '', couponId = null;
  if (b.couponId) {
    const cp = db.coupons.find(c => c.id === Number(b.couponId) && c.status === 1);
    if (cp && totalAmount >= cp.threshold) {
      discountAmount = couponReduce(cp, totalAmount);
      couponTitle = cp.name;
      couponId = cp.id;
      cp.status = 2;
      persist('coupons');
    }
  }
  const freight = calcFreight(totalAmount - discountAmount, addr.distanceKm);
  const payAmount = Math.round((totalAmount - discountAmount + freight) * 100) / 100;

  const ts = Date.now();
  const id = nextId(db.orders);
  const order = {
    id,
    orderNo: 'SN' + formatDate(new Date(ts), 'YYYYMM DD').replace(' ', '') + String(1000 + id).slice(1),
    status: 1,
    items,
    totalAmount, discountAmount, freight, payAmount,
    couponId, couponTitle,
    payType: Number(b.payType) || 1,
    remark: b.remark || '',
    deliveryDate: b.deliveryDate || '今天',
    deliverySlot: b.deliverySlot || '尽快送达（预计45分钟）',
    addressSnapshot: { name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail },
    rider: null,
    timeline: [{ time: nowStr(), status: '订单已提交', remark: '您的订单已提交成功，请尽快支付' }],
    isReviewed: false,
    createTime: nowStr(),
    createdTs: ts
  };
  db.orders.unshift(order);
  persist('orders');
  // 从购物车移除已结算商品
  if (b.fromCart) {
    const goodsKeys = items.map(it => it.goodsId + '|' + it.specText);
    db.carts = db.carts.filter(c => !(c.checked && goodsKeys.indexOf(c.goodsId + '|' + c.specText) > -1));
    persist('carts');
  }
  // 成长值
  const u = getUser();
  u.growthValue = (u.growthValue || 0) + Math.floor(payAmount);
  saveUser(u);
  return order;
});

route('POST', '/order/pay', (b) => {
  const o = db.orders.find(x => x.id === Number(b.id));
  if (!o) throw new Error('订单不存在');
  if (o.status !== 1) throw new Error('订单状态已变更，请刷新');
  o.status = 2;
  o.timeline.push({ time: nowStr(), status: '支付成功', remark: o.payType === 2 ? '货到付款订单已确认' : '微信支付成功（演示环境，不产生真实交易）' });
  persist('orders');
  addMessage(2, '支付成功', `您的订单 ${o.orderNo} 已支付成功，商家正在备货。`, o.id, 'order');
  return o;
});

route('POST', '/order/cancel', (b) => {
  const o = db.orders.find(x => x.id === Number(b.id));
  if (!o) throw new Error('订单不存在');
  if (o.status !== 1) throw new Error('当前状态不可取消');
  o.status = 6;
  o.timeline.push({ time: nowStr(), status: '订单已取消', remark: '用户主动取消订单' });
  persist('orders');
  return o;
});

route('POST', '/order/confirm', (b) => {
  const o = db.orders.find(x => x.id === Number(b.id));
  if (!o) throw new Error('订单不存在');
  if (o.status !== 4 && o.status !== 3) throw new Error('当前状态不可确认收货');
  o.status = 5;
  o.timeline.push({ time: nowStr(), status: '交易完成', remark: '感谢您的购买，欢迎再次光临' });
  persist('orders');
  return o;
});

// Mock 状态推进：2待发货 → 3配送中 → 4待收货
route('POST', '/order/advance', (b) => {
  const o = db.orders.find(x => x.id === Number(b.id));
  if (!o) throw new Error('订单不存在');
  if (o.status === 2) {
    o.status = 3;
    o.timeline.push({ time: nowStr(), status: '分拣完成', remark: '商品已分拣打包完成' });
    o.timeline.push({ time: nowStr(), status: '骑手取货', remark: '骑手王师傅已取货，正在配送途中' });
    o.rider = { name: '王师傅', phone: '136****5678' };
    addMessage(2, '订单配送中', `您的订单 ${o.orderNo} 已由骑手取货，正在火速配送中。`, o.id, 'order');
  } else if (o.status === 3) {
    o.status = 4;
    o.timeline.push({ time: nowStr(), status: '已送达', remark: '商品已送达，请确认收货' });
    addMessage(2, '订单已送达', `您的订单 ${o.orderNo} 已送达，请及时确认收货。`, o.id, 'order');
  } else {
    throw new Error('当前状态无需推进');
  }
  persist('orders');
  return o;
});

route('POST', '/order/rebuy', (b) => {
  const o = db.orders.find(x => x.id === Number(b.id));
  if (!o) throw new Error('订单不存在');
  o.items.forEach(it => {
    const g = goodsSeed.find(x => x.id === it.goodsId);
    const exist = db.carts.find(c => c.goodsId === it.goodsId && c.specText === it.specText && !c.invalid);
    if (exist) exist.count += it.count;
    else db.carts.push({
      id: nextId(db.carts), goodsId: it.goodsId, name: it.name, pic: it.pic,
      specText: it.specText, price: it.price, count: it.count,
      checked: true, stock: g ? g.stock : 99, invalid: false
    });
  });
  persist('carts');
  return { cartCount: db.carts.filter(c => !c.invalid).reduce((s, c) => s + c.count, 0) };
});

// ===== 评价 =====
route('GET', '/review/goods', (q) => {
  const list = reviews.filter(r => r.goodsId === Number(q.goodsId));
  const avg = list.length ? Math.round(list.reduce((s, r) => s + r.score, 0) / list.length * 10) / 10 : 5;
  const tagCount = {};
  list.forEach(r => (r.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const tags = Object.keys(tagCount).map(k => ({ name: k, count: tagCount[k] })).sort((a, b) => b.count - a.count).slice(0, 8);
  const paged = paginate(list, q.current, q.size);
  paged.summary = { avg, count: list.length, tags };
  return paged;
});

route('GET', '/review/shop', (q) => {
  const paged = paginate(shopReviews, q.current, q.size);
  const n = shopReviews.length || 1;
  paged.summary = {
    fresh: Math.round(shopReviews.reduce((s, r) => s + r.scores.fresh, 0) / n * 10) / 10,
    speed: Math.round(shopReviews.reduce((s, r) => s + r.scores.speed, 0) / n * 10) / 10,
    package: Math.round(shopReviews.reduce((s, r) => s + r.scores.package, 0) / n * 10) / 10
  };
  return paged;
});

route('POST', '/review/submit', (b) => {
  const o = db.orders.find(x => x.id === Number(b.orderId));
  if (!o) throw new Error('订单不存在');
  if (o.isReviewed) throw new Error('该订单已评价');
  const u = getUser();
  const extraR = wx.getStorageSync('mock_reviews_extra') || [];
  (b.goodsReviews || []).forEach(gr => {
    const rec = {
      id: nextId(reviews), orderId: o.id, goodsId: Number(gr.goodsId),
      userId: u.id, userName: u.nickName, avatar: u.avatar,
      score: Math.min(5, Math.max(1, Number(gr.score) || 5)),
      tags: gr.tags || [], content: gr.content || '', images: gr.images || [],
      createTime: nowStr()
    };
    reviews.unshift(rec);
    extraR.unshift(rec);
  });
  if (b.shopScores) {
    const srec = {
      id: nextId(shopReviews), orderId: o.id, userId: u.id, userName: u.nickName, avatar: u.avatar,
      scores: {
        fresh: Number(b.shopScores.fresh) || 5,
        speed: Number(b.shopScores.speed) || 5,
        package: Number(b.shopScores.package) || 5
      },
      content: b.shopContent || '', createTime: nowStr()
    };
    shopReviews.unshift(srec);
    const extraS = wx.getStorageSync('mock_shopreviews_extra') || [];
    extraS.unshift(srec);
    wx.setStorageSync('mock_shopreviews_extra', extraS.slice(0, 50));
  }
  wx.setStorageSync('mock_reviews_extra', extraR.slice(0, 50));
  o.isReviewed = true;
  persist('orders');
  addPoints(20, 3, '评价订单奖励');
  return { points: 20 };
});

// ===== 会员 =====
route('GET', '/member/info', () => {
  const u = getUser();
  const levels = membersData.levels;
  const lv = levels.find(l => l.level === (u.level || 1)) || levels[0];
  const next = levels.find(l => l.level === lv.level + 1);
  const month = new Date().getMonth() + 1;
  const birthMonth = u.birthday ? Number(String(u.birthday).split('-')[1]) : 0;
  const claimKey = 'mock_birthday_' + new Date().getFullYear();
  return {
    userId: u.id, nickName: u.nickName, avatar: u.avatar, phone: u.phone,
    level: lv.level, levelName: lv.levelName,
    growthValue: u.growthValue || 0,
    nextLevelGrowth: next ? next.growth : null,
    nextLevelName: next ? next.levelName : null,
    points: u.points || 0,
    couponCount: db.coupons.filter(c => c.status === 1).length,
    validDate: '2027-12-31',
    privileges: lv.privileges,
    discountText: lv.discountText,
    isBirthdayMonth: month === birthMonth,
    birthdayClaimed: !!wx.getStorageSync(claimKey)
  };
});

route('GET', '/member/levels', () => membersData.levels);

route('POST', '/member/birthday', () => {
  const u = getUser();
  const month = new Date().getMonth() + 1;
  const birthMonth = u.birthday ? Number(String(u.birthday).split('-')[1]) : 0;
  if (month !== birthMonth) throw new Error('当前不是您的生日月哦');
  const claimKey = 'mock_birthday_' + new Date().getFullYear();
  if (wx.getStorageSync(claimKey)) throw new Error('生日礼包已领取过了');
  const coupon = {
    id: nextId(db.coupons), tplId: 999, name: '生日豪华礼包券 满99减30',
    type: 1, threshold: 99, discount: 30, scope: '全场通用',
    status: 1, expireTime: formatDate(new Date(Date.now() + 30 * 86400000), 'YYYY-MM-DD') + ' 23:59',
    source: '生日赠送'
  };
  db.coupons.push(coupon);
  persist('coupons');
  addPoints(100, 5, '生日月专属赠送');
  wx.setStorageSync(claimKey, true);
  return { coupon, points: 100 };
});

// ===== 积分 =====
route('GET', '/points/info', () => {
  const u = getUser();
  return { points: u.points || 0 };
});
route('GET', '/points/records', (q) => paginate(db.points, q.current, q.size));
route('GET', '/points/mall', () => couponsData.mall);
route('POST', '/points/exchange', (b) => {
  const item = couponsData.mall.find(x => x.id === Number(b.id));
  if (!item) throw new Error('兑换商品不存在');
  const u = getUser();
  if ((u.points || 0) < item.points) throw new Error('积分不足，快去签到赚积分吧');
  addPoints(-item.points, 4, '积分兑换 ' + item.name);
  const coupon = {
    id: nextId(db.coupons), tplId: item.tplId, name: item.name, type: item.type,
    threshold: item.threshold, discount: item.discount, scope: item.scope,
    status: 1, expireTime: formatDate(new Date(Date.now() + 30 * 86400000), 'YYYY-MM-DD') + ' 23:59',
    source: '积分兑换'
  };
  db.coupons.push(coupon);
  persist('coupons');
  return { coupon, points: getUser().points };
});

// ===== 签到 =====
route('GET', '/checkin/info', () => {
  const today = todayStr();
  db.checkin.todaySigned = db.checkin.lastSignDate === today;
  return {
    continuousDays: db.checkin.continuousDays,
    todaySigned: db.checkin.todaySigned,
    monthRecords: db.checkin.monthRecords,
    rewards: checkinData.rewards,
    rules: checkinData.rules,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  };
});

route('POST', '/checkin/sign', () => {
  const today = todayStr();
  if (db.checkin.lastSignDate === today) throw new Error('今天已签到，明天再来吧');
  const yesterday = formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
  const continuous = db.checkin.lastSignDate === yesterday ? db.checkin.continuousDays + 1 : 1;
  db.checkin.continuousDays = continuous;
  db.checkin.lastSignDate = today;
  db.checkin.todaySigned = true;
  const day = new Date().getDate();
  if (db.checkin.monthRecords.indexOf(day) === -1) db.checkin.monthRecords.push(day);
  persist('checkin');
  const reward = checkinData.rewards[(continuous - 1) % 7];
  addPoints(reward, 2, continuous >= 7 && (continuous - 1) % 7 === 6 ? '连续签到 7 天大奖' : '每日签到奖励');
  return { points: reward, continuousDays: continuous };
});

// ===== 优惠券 =====
route('GET', '/coupon/center', () => {
  const claimed = db.coupons.filter(c => c.status === 1).map(c => c.tplId);
  return couponsData.templates.map(t => Object.assign({}, t, { claimed: claimed.indexOf(t.id) > -1 }));
});

route('POST', '/coupon/claim', (b) => {
  const t = couponsData.templates.find(x => x.id === Number(b.id));
  if (!t) throw new Error('优惠券不存在');
  if (db.coupons.some(c => c.tplId === t.id && c.status === 1)) throw new Error('已领取过该优惠券');
  const coupon = {
    id: nextId(db.coupons), tplId: t.id, name: t.name, type: t.type,
    threshold: t.threshold, discount: t.discount, scope: t.scope,
    status: 1, expireTime: formatDate(new Date(Date.now() + 15 * 86400000), 'YYYY-MM-DD') + ' 23:59',
    source: '领取'
  };
  db.coupons.push(coupon);
  persist('coupons');
  addMessage(3, '领券成功', `您已成功领取「${t.name}」，有效期 15 天，速去使用吧~`, coupon.id, 'coupon');
  return coupon;
});

route('GET', '/coupon/mine', (q) => {
  const status = Number(q.status) || 0;
  let list = db.coupons.slice();
  if (status > 0) list = list.filter(c => c.status === status);
  return list;
});

route('GET', '/coupon/usable', (q) => {
  const amount = Number(q.amount) || 0;
  return db.coupons
    .filter(c => c.status === 1 && amount >= c.threshold)
    .sort((a, b) => couponReduce(b, amount) - couponReduce(a, amount));
});

// ===== 促销 / 拼团 =====
route('GET', '/promotion/seckill', () => promotionsData.seckill);
route('GET', '/promotion/fullreduce', () => promotionsData.fullReduce);
route('GET', '/seckill/sessions', () => ({ sessions: promotionsData.sessions }));

// 最优优惠券：返回当前金额下抵扣最多的可用券与节省金额
route('GET', '/coupon/best', (q) => {
  const amount = Number(q.amount) || 0;
  const usable = db.coupons.filter(c => c.status === 1 && amount >= c.threshold);
  if (!usable.length) return { coupon: null, saving: 0 };
  let best = usable[0], saving = couponReduce(best, amount);
  usable.forEach(c => {
    const s = couponReduce(c, amount);
    if (s > saving) { best = c; saving = s; }
  });
  return { coupon: best, saving: Math.round(saving * 100) / 100 };
});

// 配送规则（前端计算配送费/配送范围用）
route('GET', '/shop/delivery', () => {
  const u = getUser();
  const lv = membersData.levels.find(l => l.level === (u.level || 1)) || membersData.levels[0];
  return {
    rule: shop.deliveryRule,
    freeThreshold: Math.min(shop.deliveryRule.freeThreshold, lv.freeDeliveryThreshold),
    maxKm: shop.deliveryRule.maxKm
  };
});

// ===== 分享裂变 =====
// 分享得积分：每天最多 3 次，每次 +5
route('POST', '/share/reward', (b) => {
  const key = 'mock_share_' + todayStr();
  const count = wx.getStorageSync(key) || 0;
  if (count >= 3) throw new Error('今日分享奖励已领完，明天再来吧');
  wx.setStorageSync(key, count + 1);
  addPoints(5, 1, '分享' + (b.type === 'group' ? '拼团' : '商品') + '奖励');
  return { points: 5, times: count + 1 };
});

// 邀请新用户：邀请人得优惠券（Mock 直接发给当前用户演示）
route('POST', '/share/invite', (b) => {
  const coupon = {
    id: nextId(db.coupons), tplId: 998, name: '邀请有礼 满39减10',
    type: 1, threshold: 39, discount: 10, scope: '全场通用',
    status: 1, expireTime: formatDate(new Date(Date.now() + 15 * 86400000), 'YYYY-MM-DD') + ' 23:59',
    source: '邀请奖励'
  };
  db.coupons.push(coupon);
  persist('coupons');
  addMessage(4, '邀请有礼', '您通过邀请链接进入商城，已赠送您一张「满39减10」优惠券！', coupon.id, 'coupon');
  return { coupon };
});

// ===== 客服 =====
route('GET', '/service/faq', () => ({ greeting: serviceData.greeting, faqs: serviceData.faqs }));

route('POST', '/service/ask', (b) => {
  const content = String(b.content || '');
  for (const rule of serviceData.rules) {
    if (rule.keywords.some(k => content.indexOf(k) > -1)) {
      return { reply: rule.reply, matched: true };
    }
  }
  return { reply: serviceData.defaultReply, matched: false };
});

route('POST', '/service/rate', (b) => {
  const ratings = wx.getStorageSync('mock_service_ratings') || [];
  ratings.unshift({
    id: ratings.length + 1,
    speed: Math.min(5, Math.max(1, Number(b.speed) || 5)),
    satisfaction: Math.min(5, Math.max(1, Number(b.satisfaction) || 5)),
    content: b.content || '',
    createTime: nowStr()
  });
  wx.setStorageSync('mock_service_ratings', ratings.slice(0, 20));
  addPoints(5, 1, '客服评价奖励');
  return { points: 5 };
});

// ===== 售后工单 =====
// ticket: id, orderId, orderNo, type(1退款 2退货 3换货), typeText, reason, description, images,
//         amount, status(1待审核 2处理中 3已完成 4已拒绝 5已撤销), timeline[], createTime
route('POST', '/aftersale/apply', (b) => {
  const o = db.orders.find(x => x.id === Number(b.orderId));
  if (!o) throw new Error('订单不存在');
  if (o.status !== 5 && o.status !== 4) throw new Error('当前订单状态不支持申请售后');
  if (db.aftersales.some(t => t.orderId === o.id && [1, 2].indexOf(t.status) > -1)) throw new Error('该订单已有进行中的售后工单');
  const typeText = { 1: '仅退款', 2: '退货退款', 3: '换货' }[Number(b.type)] || '仅退款';
  const ticket = {
    id: nextId(db.aftersales),
    orderId: o.id,
    orderNo: o.orderNo,
    goodsSummary: o.items.map(it => it.name).join('、').slice(0, 30),
    pic: o.items[0] && o.items[0].pic,
    type: Number(b.type) || 1,
    typeText,
    reason: b.reason || '其他',
    description: b.description || '',
    images: b.images || [],
    amount: o.payAmount,
    status: 1,
    timeline: [{ time: nowStr(), status: '售后申请已提交', remark: typeText + ' · ' + (b.reason || '其他') + '，客服将在 1 小时内审核' }],
    createTime: nowStr(),
    createdTs: Date.now()
  };
  db.aftersales.unshift(ticket);
  persist('aftersales');
  o.timeline.push({ time: nowStr(), status: '发起售后', remark: typeText + '：' + (b.reason || '其他') });
  persist('orders');
  addMessage(1, '售后申请已受理', `您的订单 ${o.orderNo} 的${typeText}申请已提交，客服将尽快审核。`, ticket.id, 'aftersale');
  return ticket;
});

route('GET', '/aftersale/list', (q) => {
  const list = db.aftersales.slice().sort((a, b) => b.createdTs - a.createdTs);
  return paginate(list, q.current, q.size);
});

route('GET', '/aftersale/detail', (q) => {
  const t = db.aftersales.find(x => x.id === Number(q.id));
  if (!t) throw new Error('工单不存在');
  return t;
});

route('GET', '/aftersale/byOrder', (q) => {
  return db.aftersales.filter(x => x.orderId === Number(q.orderId));
});

// 演示用：推进工单状态 1待审核 → 2处理中 → 3已完成
route('POST', '/aftersale/advance', (b) => {
  const t = db.aftersales.find(x => x.id === Number(b.id));
  if (!t) throw new Error('工单不存在');
  if (t.status === 1) {
    t.status = 2;
    t.timeline.push({ time: nowStr(), status: '审核通过', remark: '客服已审核通过，正在为您处理' });
    addMessage(1, '售后审核通过', `您的${t.typeText}申请已审核通过，正在处理中。`, t.id, 'aftersale');
  } else if (t.status === 2) {
    t.status = 3;
    const remark = t.type === 3 ? '换货商品已发出，请注意查收' : `退款 ¥${t.amount.toFixed(2)} 已原路退回（演示环境，不产生真实交易）`;
    t.timeline.push({ time: nowStr(), status: '售后完成', remark });
    addMessage(1, '售后已完成', `您的${t.typeText}申请已处理完成。${remark}`, t.id, 'aftersale');
  } else {
    throw new Error('当前状态无需推进');
  }
  persist('aftersales');
  return t;
});

route('POST', '/aftersale/cancel', (b) => {
  const t = db.aftersales.find(x => x.id === Number(b.id));
  if (!t) throw new Error('工单不存在');
  if (t.status !== 1) throw new Error('仅待审核状态可撤销');
  t.status = 5;
  t.timeline.push({ time: nowStr(), status: '已撤销', remark: '用户主动撤销售后申请' });
  persist('aftersales');
  return t;
});

// ===== 拼团流程 =====
function groupWithGoods(g) {
  const goods = goodsSeed.find(x => x.id === g.goodsId);
  return Object.assign({}, g, { goods: goods ? { id: goods.id, name: goods.name, pic: goods.pic, specs: goods.specs, minPrice: goods.minPrice, stock: goods.stock } : null });
}

route('GET', '/group/detail', (q) => {
  const g = db.groups.find(x => x.id === Number(q.id));
  if (!g) throw new Error('拼团不存在');
  const mine = db.mygroups.find(m => m.groupId === g.id);
  return Object.assign(groupWithGoods(g), { joined: !!mine, myOrderId: mine ? mine.orderId : null });
});

route('GET', '/group/byGoods', (q) => {
  const g = db.groups.find(x => x.goodsId === Number(q.goodsId) && x.status === 1);
  return g ? groupWithGoods(g) : null;
});

route('GET', '/group/joinable', () => db.groups.filter(g => g.status === 1).map(groupWithGoods));

route('GET', '/group/mine', () => {
  return db.mygroups.map(m => {
    const g = db.groups.find(x => x.id === m.groupId);
    if (!g) return null;
    return Object.assign(groupWithGoods(g), { myOrderId: m.orderId, isLeader: m.isLeader });
  }).filter(Boolean);
});

// 开团：创建拼团 + 生成待支付订单
route('POST', '/group/start', (b) => {
  const g = goodsSeed.find(x => x.id === Number(b.goodsId));
  if (!g) throw new Error('商品不存在');
  const count = Math.max(1, Number(b.count) || 1);
  const specText = b.specText || g.specs[0].values[0].label + ' · ' + g.specs[1].values[0].label;
  const groupPrice = Math.round(g.minPrice * 0.8 * 100) / 100; // 拼团价=8折
  const id = nextId(db.groups);
  const u = getUser();
  const group = {
    id, goodsId: g.id, name: g.name, pic: g.pic,
    groupPrice, originalPrice: g.minPrice,
    requiredCount: 2, joinedCount: 1, status: 1,
    members: [{ avatar: u.avatar, name: u.nickName, isLeader: true }],
    endTime: formatDate(new Date(Date.now() + 24 * 3600000), 'YYYY-MM-DD HH:mm'),
    rules: '2 人成团，24 小时未成团自动退款'
  };
  db.groups.unshift(group);
  persist('groups');
  const order = createGroupOrder([{ goodsId: g.id, specText, price: groupPrice, count }], '拼团订单 · ' + g.name);
  db.mygroups.unshift({ groupId: id, orderId: order.id, isLeader: true, joinedAt: nowStr() });
  persist('mygroups');
  return { group: groupWithGoods(group), order };
});

// 参团：加入拼团 + 生成待支付订单；达到人数自动成团
route('POST', '/group/join', (b) => {
  const g = db.groups.find(x => x.id === Number(b.groupId));
  if (!g) throw new Error('拼团不存在');
  if (g.status !== 1) throw new Error('该拼团已结束');
  if (db.mygroups.some(m => m.groupId === g.id)) throw new Error('您已参与该拼团');
  const goods = goodsSeed.find(x => x.id === g.goodsId);
  const u = getUser();
  const count = Math.max(1, Number(b.count) || 1);
  const specText = b.specText || (goods ? goods.specs[0].values[0].label : '默认规格');
  g.joinedCount += 1;
  g.members.push({ avatar: u.avatar, name: u.nickName, isLeader: false });
  if (g.joinedCount >= g.requiredCount) {
    g.status = 2;
    addMessage(4, '拼团成功', `您参与的「${g.name}」已成团，商品将尽快为您发出！`, g.id, 'group');
  }
  persist('groups');
  const order = createGroupOrder([{ goodsId: g.goodsId, specText, price: g.groupPrice, count }], '拼团订单 · ' + g.name);
  db.mygroups.unshift({ groupId: g.id, orderId: order.id, isLeader: false, joinedAt: nowStr() });
  persist('mygroups');
  return { group: groupWithGoods(g), order };
});

// 拼团订单内部构造（复用地址/运费逻辑，状态=待付款）
function createGroupOrder(items, remark) {
  const addr = db.addresses.find(a => a.isDefault) || db.addresses[0];
  if (!addr) throw new Error('请先添加收货地址');
  const totalAmount = Math.round(items.reduce((s, it) => s + it.price * it.count, 0) * 100) / 100;
  const freight = calcFreight(totalAmount, addr.distanceKm);
  const ts = Date.now();
  const id = nextId(db.orders);
  const goodsItems = items.map(it => {
    const g = goodsSeed.find(x => x.id === Number(it.goodsId));
    return { goodsId: g.id, name: g.name, pic: g.pic, specText: it.specText, price: Number(it.price), count: it.count };
  });
  const order = {
    id,
    orderNo: 'SN' + formatDate(new Date(ts), 'YYYYMM DD').replace(' ', '') + String(1000 + id).slice(1),
    status: 1,
    items: goodsItems,
    totalAmount, discountAmount: 0, freight,
    payAmount: Math.round((totalAmount + freight) * 100) / 100,
    couponId: null, couponTitle: '',
    payType: 1, remark,
    deliveryDate: '今天', deliverySlot: '尽快送达（预计45分钟）',
    addressSnapshot: { name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail },
    rider: null,
    timeline: [{ time: nowStr(), status: '订单已提交', remark: '拼团订单已提交，请尽快支付' }],
    isReviewed: false,
    createTime: nowStr(),
    createdTs: ts
  };
  db.orders.unshift(order);
  persist('orders');
  return order;
}

route('GET', '/group/list', () => db.groups.map(groupWithGoods));
route('GET', '/group/wholesale', () => groupsData.wholesale);

// ===== 消息 =====
route('GET', '/message/list', (q) => paginate(db.messages, q.current, q.size));
route('GET', '/message/unread', () => db.messages.filter(m => !m.isRead).length);
route('POST', '/message/read', (b) => {
  const m = db.messages.find(x => x.id === Number(b.id));
  if (m) { m.isRead = true; persist('messages'); }
  return { ok: true };
});
route('POST', '/message/readAll', () => {
  db.messages.forEach(m => { m.isRead = true; });
  persist('messages');
  return { ok: true };
});

// ===== 店铺 =====
route('GET', '/shop/info', () => shop);

// ===== 用户 =====
route('GET', '/user/info', () => getUser());
route('POST', '/user/update', (b) => {
  const u = getUser();
  if (b.nickName) u.nickName = b.nickName;
  if (b.avatar) u.avatar = b.avatar;
  saveUser(u);
  return u;
});

// ===== 收藏 =====
route('POST', '/collect/toggle', (b) => {
  const goodsId = Number(b.goodsId);
  const i = db.collects.indexOf(goodsId);
  let isCollect;
  if (i > -1) { db.collects.splice(i, 1); isCollect = false; }
  else { db.collects.unshift(goodsId); isCollect = true; }
  persist('collects');
  return { isCollect };
});

route('GET', '/collect/list', () =>
  db.collects.map(id => goodsSeed.find(g => g.id === id)).filter(Boolean)
    .map(g => ({ id: g.id, name: g.name, pic: g.pic, minPrice: g.minPrice, originalPrice: g.originalPrice, numberSells: g.numberSells, tags: g.tags }))
);

route('POST', '/collect/remove', (b) => {
  const ids = (b.goodsIds || []).map(Number);
  db.collects = db.collects.filter(id => ids.indexOf(id) === -1);
  persist('collects');
  return { ok: true };
});

// ===== 足迹 =====
route('GET', '/footprint/list', () => {
  const groups = {};
  const today = todayStr();
  const yesterday = formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
  db.footprints.forEach(f => {
    const g = goodsSeed.find(x => x.id === f.goodsId);
    if (!g) return;
    const date = String(f.time).slice(0, 10);
    const label = date === today ? '今天' : (date === yesterday ? '昨天' : date);
    if (!groups[label]) groups[label] = [];
    groups[label].push({ goodsId: g.id, name: g.name, pic: g.pic, minPrice: g.minPrice, time: f.time });
  });
  return Object.keys(groups).map(k => ({ date: k, items: groups[k] }));
});

route('POST', '/footprint/clear', () => {
  db.footprints = [];
  persist('footprints');
  return { ok: true };
});

// ---------------- 分发入口 ----------------
function dispatch(url, method, data) {
  const key = method.toUpperCase() + ' ' + url;
  const handler = routes[key];
  return delay(null).then(() => {
    if (!handler) {
      return { code: 404, data: null, msg: 'Mock 接口不存在：' + key };
    }
    try {
      const result = handler(data || {});
      return { code: 200, data: result, msg: 'ok' };
    } catch (e) {
      return { code: 500, data: null, msg: e.message || '服务器开小差了' };
    }
  });
}

module.exports = { dispatch };
