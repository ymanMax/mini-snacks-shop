/**
 * Mock 总入口：API 路由分发（url + method 匹配）
 *
 * 设计：
 * - 模块级内存数据库 store：首次访问时用 mock/data 种子数据初始化，并结合 wx.setStorageSync 持久化；
 * - 所有写操作（加购/下单/领券/签到/兑换/评价/拼团等）在内存中真实生效并落盘，跨页面一致；
 * - 所有响应统一 { code, data, msg }，分页统一 { records, total, current, size }；
 * - 统一 200~600ms 随机延迟（mock/delay.js）。
 */
const { mockResponse, mockError } = require('./delay.js');

const goodsData = require('./data/goods.js');
const { categories } = require('./data/categories.js');
const { carts: seedCarts } = require('./data/carts.js');
const { addresses: seedAddresses } = require('./data/addresses.js');
const { orders: seedOrders } = require('./data/orders.js');
const { reviews: seedReviews, TAG_POOL } = require('./data/reviews.js');
const { shopReviews: seedShopReviews } = require('./data/shopReviews.js');
const { levels, getLevelConf } = require('./data/members.js');
const { user: seedUser } = require('./data/user.js');
const { records: seedPoints, exchangeGoods, rules: pointsRules, TYPE_TEXT } = require('./data/points.js');
const { buildInitialCheckin, rewards: checkinRewards, rules: checkinRules } = require('./data/checkin.js');
const { templates: couponTemplates, userCoupons: seedUserCoupons } = require('./data/coupons.js');
const { promotions, calcFullReduce } = require('./data/promotions.js');
const { groupBuys: seedGroups, wholesales } = require('./data/groups.js');
const { messages: seedMessages, TYPE_TEXT: MSG_TYPE_TEXT } = require('./data/messages.js');
const { shop, calcFreight } = require('./data/shop.js');
const service = require('./data/service.js');

/* ==================== 内存数据库（store） ==================== */

const hasWx = typeof wx !== 'undefined' && wx.getStorageSync && wx.setStorageSync;

function deepCopy(o) {
  return JSON.parse(JSON.stringify(o));
}

function loadSeed(key, seed) {
  if (hasWx) {
    try {
      const v = wx.getStorageSync(key);
      if (v !== '' && v !== null && v !== undefined) return v;
    } catch (e) { /* ignore */ }
  }
  const data = deepCopy(seed);
  save(key, data);
  return data;
}

function save(key, data) {
  if (hasWx) {
    try { wx.setStorageSync(key, data); } catch (e) { /* ignore */ }
  }
}

const store = {};
function S(name) {
  if (!store[name]) {
    switch (name) {
      case 'carts': store.carts = loadSeed('mock_carts', seedCarts); break;
      case 'addresses': store.addresses = loadSeed('mock_addresses', seedAddresses); break;
      case 'orders': store.orders = loadSeed('mock_orders', seedOrders); break;
      case 'reviews': store.reviews = loadSeed('mock_reviews', seedReviews); break;
      case 'shopReviews': store.shopReviews = loadSeed('mock_shop_reviews', seedShopReviews); break;
      case 'user': store.user = loadSeed('mock_user', seedUser); break;
      case 'pointsRecords': store.pointsRecords = loadSeed('mock_points', seedPoints); break;
      case 'checkin': store.checkin = loadSeed('mock_checkin', buildInitialCheckin()); break;
      case 'userCoupons': store.userCoupons = loadSeed('mock_coupons', seedUserCoupons); break;
      case 'groups': store.groups = loadSeed('mock_groups', seedGroups); break;
      case 'messages': store.messages = loadSeed('mock_messages', seedMessages); break;
      case 'collects': store.collects = loadSeed('mock_collects', [1, 10, 19, 23]); break;
      case 'footprints': store.footprints = loadSeed('mock_footprints', []); break;
      case 'searchHistory': store.searchHistory = loadSeed('mock_search_history', ['每日坚果', '薯片', '辣条']); break;
      case 'service': store.service = loadSeed('mock_service', { tickets: service.tickets, serviceReviews: service.serviceReviews }); break;
      default: throw new Error('unknown store: ' + name);
    }
  }
  return store[name];
}
function persist(name) {
  save({ carts: 'mock_carts', addresses: 'mock_addresses', orders: 'mock_orders', reviews: 'mock_reviews', shopReviews: 'mock_shop_reviews', user: 'mock_user', pointsRecords: 'mock_points', checkin: 'mock_checkin', userCoupons: 'mock_coupons', groups: 'mock_groups', messages: 'mock_messages', collects: 'mock_collects', footprints: 'mock_footprints', searchHistory: 'mock_search_history', service: 'mock_service' }[name], store[name]);
}

/** 全部缓存数据重置（"清除缓存"入口用） */
function resetAll() {
  Object.keys(store).forEach((k) => delete store[k]);
  if (hasWx) {
    ['mock_carts', 'mock_addresses', 'mock_orders', 'mock_reviews', 'mock_shop_reviews', 'mock_user', 'mock_points', 'mock_checkin', 'mock_coupons', 'mock_groups', 'mock_messages', 'mock_collects', 'mock_footprints', 'mock_search_history', 'mock_service'].forEach((k) => {
      try { wx.removeStorageSync(k); } catch (e) { /* ignore */ }
    });
  }
}

/* ==================== 小工具 ==================== */

function pad(n) { return n < 10 ? '0' + n : String(n); }
function nowStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function round2(n) { return Math.round(Number(n) * 100) / 100; }
function nextId(arr) { return arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1; }
function genOrderNo() {
  const d = new Date();
  return 'SN' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + String(Math.floor(Math.random() * 900) + 100);
}
function paginate(list, current, size) {
  const cur = Math.max(1, parseInt(current) || 1);
  const sz = Math.max(1, parseInt(size) || 10);
  const total = list.length;
  const start = (cur - 1) * sz;
  return { records: list.slice(start, start + sz), total, current: cur, size: sz };
}
const goodsById = (id) => goodsData.list.find((g) => g.id === Number(id));

/** 商品对象附带收藏态输出 */
function withCollect(g) {
  const collects = S('collects');
  return Object.assign({}, g, { isCollect: collects.indexOf(g.id) > -1 });
}

/** 从可用券中挑选最优券（减免金额最大） */
function pickBestCoupon(coupons, amount) {
  let best = null;
  let bestCut = 0;
  coupons.forEach((c) => {
    if (c.status !== 1 || Number(amount) < c.threshold) return;
    const cut = c.type === 2 ? round2(Number(amount) * (100 - c.discount) / 100) : Number(c.discount);
    if (cut > bestCut) { bestCut = cut; best = c; }
  });
  return best ? Object.assign({}, best, { cutAmount: bestCut }) : null;
}

/** 购物车汇总（统一口径：仅有效商品参与勾选与金额计算） */
function cartSummary() {
  const items = S('carts');
  const valid = items.filter((it) => !it.invalid);
  const checked = valid.filter((it) => it.checked);
  const checkedAmount = round2(checked.reduce((s, it) => s + it.price * it.count, 0));
  // 促销提示：下一档满减 / 还差 xx 元免配送费 / 可用券与最优券
  const freeThreshold = getLevelConf(S('user').level).freeShipThreshold;
  const fullReduceRules = (promotions.find((p) => p.type === 2) || {}).fullReduceRules || [];
  let nextTier = null;
  for (let i = 0; i < fullReduceRules.length; i++) {
    const r = fullReduceRules[i];
    if (checkedAmount < r.threshold) {
      nextTier = { threshold: r.threshold, reduce: r.reduce, diff: round2(r.threshold - checkedAmount) };
      break;
    }
  }
  const usableCoupons = S('userCoupons').filter((c) => c.status === 1 && checkedAmount >= c.threshold);
  return {
    items: items,
    summary: {
      totalCount: valid.reduce((s, it) => s + it.count, 0),
      validCount: valid.length,
      invalidCount: items.length - valid.length,
      checkedCount: checked.reduce((s, it) => s + it.count, 0),
      checkedAmount,
      allChecked: valid.length > 0 && checked.length === valid.length,
      fullReduce: calcFullReduce(checkedAmount), // 当前已享满减
      promo: {
        nextTier,                                                       // 下一档满减（null=已享最高档）
        freeShipDiff: checkedAmount >= freeThreshold ? 0 : round2(freeThreshold - checkedAmount), // 还差 xx 元免配送费
        freeThreshold,
        usableCouponCount: usableCoupons.length,
        bestCoupon: pickBestCoupon(usableCoupons, checkedAmount)        // 自动最优券
      }
    }
  };
}

/** 积分变动 + 记录 */
function addPoints(points, desc, type) {
  const user = S('user');
  user.points = Math.max(0, (user.points || 0) + points);
  const records = S('pointsRecords');
  records.unshift({ id: nextId(records), type: type || 2, points, desc, createTime: nowStr() });
  persist('pointsRecords');
  persist('user');
}

/** 成长值变动 + 自动升级 */
function addGrowth(v) {
  const user = S('user');
  user.growthValue = (user.growthValue || 0) + v;
  let upgraded = null;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (user.growthValue >= levels[i].growth && levels[i].level > user.level) {
      user.level = levels[i].level;
      upgraded = levels[i].levelName;
      break;
    }
  }
  persist('user');
  return upgraded;
}

/** 写入消息通知（link：点击消息跳转的页面路由） */
function pushMessage(type, title, content, relatedId, link) {
  const msgs = S('messages');
  msgs.unshift({ id: nextId(msgs), type, title, content, isRead: false, createTime: nowStr(), relatedId: relatedId || null, link: link || '' });
  persist('messages');
}

/** 拼团过期扫描：拼团中且已过截止时间 → 未成团自动退款（status 3），关联订单自动取消 */
function groupExpireSweep() {
  const groups = S('groups');
  let changed = false;
  groups.forEach((gp) => {
    if (gp.status === 1 && gp.endTimestamp && gp.endTimestamp < Date.now()) {
      gp.status = 3;
      changed = true;
      const orders = S('orders');
      let orderChanged = false;
      orders.forEach((o) => {
        if (o.status <= 2 && o.remark && o.remark.indexOf('拼团订单 #' + gp.id) > -1) {
          o.status = 6;
          o.timeline.push({ time: nowStr(), status: 6, remark: '拼团未成团，订单已自动取消并全额退款' });
          orderChanged = true;
        }
      });
      if (orderChanged) persist('orders');
      pushMessage(2, '拼团未成团已退款', '「' + gp.name + '」24 小时未成团，已自动取消并全额退款（演示环境）。', gp.id, '/pages/group/detail?id=' + gp.id);
    }
  });
  if (changed) persist('groups');
}

/** 构造拼团订单（待付款），地址超范围/缺失时返回 null（不阻断参团本身） */
function createGroupOrder(gp, count, specText) {
  const g = goodsById(gp.goodsId);
  if (!g) return null;
  const addr = S('addresses').find((a) => a.isDefault) || S('addresses')[0];
  if (!addr || Number(addr.distanceKm) > shop.deliveryRule.maxKm) return null;
  const orders = S('orders');
  const totalAmount = round2(gp.groupPrice * count);
  const freight = calcFreight(totalAmount, addr.distanceKm, getLevelConf(S('user').level).freeShipThreshold);
  const order = {
    id: nextId(orders), orderNo: genOrderNo(), status: 1,
    items: [{ goodsId: g.id, name: g.name, pic: g.pic, specText: specText || g.specs[0].values[0].label, price: gp.groupPrice, count }],
    totalAmount, discountAmount: 0, freight,
    payAmount: round2(totalAmount + freight),
    couponId: null, couponTitle: '', payType: 1,
    remark: '拼团订单 #' + gp.id,
    deliveryDate: todayStr(), deliverySlot: '尽快送达（预计45分钟）',
    addressSnapshot: { name: addr.name, phone: addr.phone, full: addr.province + addr.city + addr.district + addr.detail, tag: addr.tag },
    rider: null, isReviewed: false, createTime: nowStr(),
    timeline: [{ time: nowStr(), status: 1, remark: '拼团订单已创建，等待付款' }]
  };
  orders.unshift(order);
  persist('orders');
  return order;
}

/* ==================== 路由表 ==================== */

/**
 * 路由：[method, RegExp, handler(query)]
 * handler 返回值即 data；handler 可 return { __fail: msg } 表示业务失败
 */
const routes = [

  /* ---------- 首页 / 商品 ---------- */
  ['GET', /^\/banner\/list$/, () => goodsData.banners],

  ['GET', /^\/theme\/list$/, () => goodsData.themes.map((t) => Object.assign({}, t, {
    goodsList: t.products.map(goodsById).filter(Boolean).map(withCollect)
  }))],

  ['GET', /^\/theme\/detail$/, (q) => {
    const t = goodsData.themes.find((x) => x.id === Number(q.id));
    if (!t) return { __fail: '主题不存在' };
    return Object.assign({}, t, { goodsList: t.products.map(goodsById).filter(Boolean).map(withCollect) });
  }],

  ['GET', /^\/category\/list$/, () => categories],

  ['GET', /^\/goods\/page$/, (q) => {
    const current = parseInt(q.current) || 1;
    const size = parseInt(q.size) || 10;
    let list = goodsData.list.slice();
    if (q.categoryId) list = list.filter((g) => g.categoryId === Number(q.categoryId));
    if (q.themeId) {
      const t = goodsData.themes.find((x) => x.id === Number(q.themeId));
      if (t) list = list.filter((g) => t.products.indexOf(g.id) > -1);
    }
    if (q.keywords) {
      const kw = String(q.keywords).trim().toLowerCase();
      list = list.filter((g) =>
        g.name.toLowerCase().indexOf(kw) > -1 ||
        g.origin.toLowerCase().indexOf(kw) > -1 ||
        g.categoryName.indexOf(kw) > -1 ||
        g.tags.some((t) => t.indexOf(kw) > -1));
    }
    if (q.minPrice !== undefined && q.minPrice !== '' && q.minPrice !== null) list = list.filter((g) => g.minPrice >= Number(q.minPrice));
    if (q.maxPrice !== undefined && q.maxPrice !== '' && q.maxPrice !== null) list = list.filter((g) => g.minPrice <= Number(q.maxPrice));
    if (q.origins) {
      let origins = q.origins;
      if (typeof origins === 'string') origins = origins.split(',').filter(Boolean);
      if (origins.length) list = list.filter((g) => origins.some((o) => g.origin.indexOf(o) > -1));
    }
    if (String(q.inStock) === 'true' || q.inStock === true || q.inStock === 1 || q.inStock === '1') list = list.filter((g) => g.stock > 0);
    switch (q.sort) {
      case 'priceAsc': list.sort((a, b) => a.minPrice - b.minPrice); break;
      case 'priceDesc': list.sort((a, b) => b.minPrice - a.minPrice); break;
      case 'sales': list.sort((a, b) => b.numberSells - a.numberSells); break;
      default: list.sort((a, b) => b.hotScore - a.hotScore);
    }
    const page = paginate(list, current, size);
    page.records = page.records.map(withCollect);
    return page;
  }],

  ['GET', /^\/goods\/detail$/, (q) => {
    const g = goodsById(q.id);
    if (!g) return { __fail: '商品不存在' };
    g.viewCount += 1;
    return withCollect(g);
  }],

  ['GET', /^\/goods\/recommend$/, (q) => {
    const g = goodsById(q.id);
    let list = goodsData.list.filter((x) => x.id !== Number(q.id));
    if (g) {
      const same = list.filter((x) => x.categoryId === g.categoryId);
      const other = list.filter((x) => x.categoryId !== g.categoryId);
      list = same.concat(other);
    }
    return list.slice(0, 6).map(withCollect);
  }],

  ['GET', /^\/goods\/guess$/, () => {
    const list = goodsData.list.slice().sort((a, b) => b.hotScore - a.hotScore);
    return list.slice(0, 10).map(withCollect);
  }],

  /* ---------- 搜索 ---------- */
  ['GET', /^\/search\/hot$/, () => ['每日坚果', '薯片', '辣条', '气泡水', '猪肉脯', '芒果干', '曲奇', '零食大礼包', '鸭脖', '巧克力']],

  ['GET', /^\/search\/suggest$/, (q) => {
    const kw = String(q.keywords || '').trim().toLowerCase();
    if (!kw) return [];
    return goodsData.list
      .filter((g) => g.name.toLowerCase().indexOf(kw) > -1)
      .slice(0, 10)
      .map((g) => ({ id: g.id, name: g.name, pic: g.pic, price: g.minPrice }));
  }],

  ['GET', /^\/search\/history$/, () => S('searchHistory')],
  ['POST', /^\/search\/history\/add$/, (q) => {
    const kw = String(q.keyword || '').trim();
    if (!kw) return S('searchHistory');
    const h = S('searchHistory');
    const idx = h.indexOf(kw);
    if (idx > -1) h.splice(idx, 1);
    h.unshift(kw);
    if (h.length > 15) h.length = 15;
    persist('searchHistory');
    return h;
  }],
  ['POST', /^\/search\/history\/delete$/, (q) => {
    const h = S('searchHistory');
    const idx = h.indexOf(String(q.keyword || ''));
    if (idx > -1) h.splice(idx, 1);
    persist('searchHistory');
    return h;
  }],
  ['POST', /^\/search\/history\/clear$/, () => {
    store.searchHistory = [];
    persist('searchHistory');
    return [];
  }],

  /* ---------- 收藏 / 足迹 ---------- */
  ['POST', /^\/collect\/toggle$/, (q) => {
    const gid = Number(q.goodsId);
    if (!goodsById(gid)) return { __fail: '商品不存在' };
    const collects = S('collects');
    const idx = collects.indexOf(gid);
    if (idx > -1) collects.splice(idx, 1); else collects.push(gid);
    persist('collects');
    return { isCollect: idx === -1, collectCount: collects.length };
  }],

  ['GET', /^\/collect\/page$/, (q) => {
    const collects = S('collects');
    const list = collects.map(goodsById).filter(Boolean).reverse().map((g) => withCollect(g));
    return paginate(list, q.current, q.size);
  }],

  ['POST', /^\/footprint\/add$/, (q) => {
    const gid = Number(q.goodsId);
    const g = goodsById(gid);
    if (!g) return { __fail: '商品不存在' };
    const fps = S('footprints');
    const exist = fps.find((f) => f.goodsId === gid);
    if (exist) fps.splice(fps.indexOf(exist), 1);
    fps.unshift({ goodsId: gid, time: Date.now(), date: todayStr() });
    if (fps.length > 100) fps.length = 100;
    persist('footprints');
    return { count: fps.length };
  }],

  ['GET', /^\/footprint\/list$/, () => {
    const fps = S('footprints');
    const groups = [];
    fps.forEach((f) => {
      const g = goodsById(f.goodsId);
      if (!g) return;
      let grp = groups.find((x) => x.date === f.date);
      if (!grp) { grp = { date: f.date, goods: [] }; groups.push(grp); }
      grp.goods.push(withCollect(g));
    });
    return groups;
  }],

  ['POST', /^\/footprint\/clear$/, () => {
    store.footprints = [];
    persist('footprints');
    return { count: 0 };
  }],

  /* ---------- 购物车 ---------- */
  ['GET', /^\/cart\/list$/, () => cartSummary()],

  ['GET', /^\/cart\/count$/, () => ({ count: cartSummary().summary.totalCount })],

  ['POST', /^\/cart\/add$/, (q) => {
    const g = goodsById(q.goodsId);
    if (!g) return { __fail: '商品不存在' };
    const count = Math.max(1, parseInt(q.count) || 1);
    const specText = q.specText || g.specs[0].values[0].label;
    const price = q.price !== undefined ? round2(q.price) : g.specs[0].values[0].price;
    const carts = S('carts');
    const exist = carts.find((it) => it.goodsId === g.id && it.specText === specText && it.price === price && !it.invalid);
    if (exist) {
      exist.count = Math.min(exist.count + count, exist.stock || 999);
    } else {
      carts.push({
        id: nextId(carts), goodsId: g.id, name: q.name || g.name, pic: q.pic || g.pic,
        specText, price, count, checked: true, stock: q.stock !== undefined ? q.stock : g.stock, invalid: false
      });
    }
    persist('carts');
    return cartSummary();
  }],

  ['POST', /^\/cart\/update$/, (q) => {
    const carts = S('carts');
    const it = carts.find((x) => x.id === Number(q.id));
    if (!it) return { __fail: '购物车项不存在' };
    if (q.count !== undefined) {
      const c = parseInt(q.count);
      if (isNaN(c) || c < 1) return { __fail: '数量不合法' };
      if (c > (it.stock || 999)) return { __fail: '超出库存上限' };
      it.count = c;
    }
    if (q.checked !== undefined) it.checked = q.checked === true || q.checked === 'true';
    persist('carts');
    return cartSummary();
  }],

  ['POST', /^\/cart\/checkAll$/, (q) => {
    const carts = S('carts');
    const checked = q.checked === true || q.checked === 'true';
    carts.forEach((it) => { if (!it.invalid) it.checked = checked; });
    persist('carts');
    return cartSummary();
  }],

  ['POST', /^\/cart\/delete$/, (q) => {
    let ids = q.ids;
    if (!Array.isArray(ids)) ids = String(ids === undefined ? q.id : ids).split(',').map(Number);
    ids = ids.map(Number);
    const carts = S('carts');
    store.carts = carts.filter((it) => ids.indexOf(it.id) === -1);
    persist('carts');
    return cartSummary();
  }],

  ['POST', /^\/cart\/clearInvalid$/, () => {
    store.carts = S('carts').filter((it) => !it.invalid);
    persist('carts');
    return cartSummary();
  }],

  /* ---------- 收货地址 ---------- */
  ['GET', /^\/address\/list$/, () => {
    const list = S('addresses').slice();
    list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    const maxKm = shop.deliveryRule.maxKm;
    return list.map((a) => Object.assign({}, a, { outOfRange: Number(a.distanceKm) > maxKm }));
  }],

  ['GET', /^\/address\/default$/, () => {
    const a = S('addresses').find((x) => x.isDefault) || S('addresses')[0] || null;
    return a ? Object.assign({}, a, { outOfRange: Number(a.distanceKm) > shop.deliveryRule.maxKm }) : null;
  }],

  ['GET', /^\/address\/detail$/, (q) => {
    const a = S('addresses').find((x) => x.id === Number(q.id));
    return a || { __fail: '地址不存在' };
  }],

  ['POST', /^\/address\/save$/, (q) => {
    const list = S('addresses');
    const addr = {
      name: q.name, phone: q.phone, province: q.province || '广东省', city: q.city || '深圳市',
      district: q.district || '', detail: q.detail, tag: q.tag || '家',
      isDefault: q.isDefault === true || q.isDefault === 'true',
      distanceKm: q.distanceKm !== undefined ? Number(q.distanceKm) : Math.round(Math.random() * 200) / 10 + 1
    };
    if (!addr.name || !addr.phone || !addr.detail) return { __fail: '姓名/电话/详细地址必填' };
    if (addr.isDefault) list.forEach((a) => { a.isDefault = false; });
    if (q.id) {
      const exist = list.find((a) => a.id === Number(q.id));
      if (!exist) return { __fail: '地址不存在' };
      Object.assign(exist, addr);
    } else {
      addr.id = nextId(list);
      if (list.length === 0) addr.isDefault = true;
      list.push(addr);
    }
    persist('addresses');
    return list;
  }],

  ['POST', /^\/address\/delete$/, (q) => {
    const list = S('addresses');
    const idx = list.findIndex((a) => a.id === Number(q.id));
    if (idx === -1) return { __fail: '地址不存在' };
    list.splice(idx, 1);
    if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
    persist('addresses');
    return list;
  }],

  ['POST', /^\/address\/setDefault$/, (q) => {
    const list = S('addresses');
    const target = list.find((a) => a.id === Number(q.id));
    if (!target) return { __fail: '地址不存在' };
    list.forEach((a) => { a.isDefault = a.id === target.id; });
    persist('addresses');
    return list;
  }],

  ['GET', /^\/address\/mapPois$/, () => ({ pois: service.mapPois, maxKm: shop.deliveryRule.maxKm })],

  /* ---------- 订单 ---------- */

  /** 结算预览：fromCart=true 用购物车勾选项，否则用 items */
  ['POST', /^\/order\/preview$/, (q) => {
    let items = [];
    if (String(q.fromCart) === 'true') {
      items = S('carts').filter((it) => it.checked && !it.invalid)
        .map((it) => ({ goodsId: it.goodsId, name: it.name, pic: it.pic, specText: it.specText, price: it.price, count: it.count, cartId: it.id }));
    } else {
      items = (q.items || []).map((it) => ({ goodsId: it.goodsId, name: it.name, pic: it.pic, specText: it.specText, price: round2(it.price), count: it.count }));
    }
    if (!items.length) return { __fail: '没有可结算的商品' };
    const addr = q.addressId ? S('addresses').find((a) => a.id === Number(q.addressId)) : (S('addresses').find((a) => a.isDefault) || S('addresses')[0] || null);
    const totalAmount = round2(items.reduce((s, it) => s + it.price * it.count, 0));
    let coupon = null;
    if (q.couponId) coupon = S('userCoupons').find((c) => c.id === Number(q.couponId) && c.status === 1) || null;
    let couponDiscount = 0;
    if (coupon && totalAmount >= coupon.threshold) {
      couponDiscount = coupon.type === 2 ? round2(totalAmount * (100 - coupon.discount) / 100) : coupon.discount;
      couponDiscount = Math.min(couponDiscount, totalAmount);
    }
    const freeThreshold = getLevelConf(S('user').level).freeShipThreshold;
    const outOfRange = !!addr && Number(addr.distanceKm) > shop.deliveryRule.maxKm;
    const freight = addr ? calcFreight(totalAmount, addr.distanceKm, freeThreshold) : shop.deliveryRule.baseFee;
    return {
      items, totalAmount, couponDiscount: round2(couponDiscount), freight,
      payAmount: round2(totalAmount - couponDiscount + freight),
      fullReduce: calcFullReduce(totalAmount),
      address: addr, coupon,
      outOfRange,
      maxKm: shop.deliveryRule.maxKm,
      bestCoupon: pickBestCoupon(S('userCoupons'), totalAmount) // 自动最优券（未手动选券时默认选中）
    };
  }],

  ['POST', /^\/order\/create$/, (q) => {
    const previewBase = q.items && q.items.length ? q.items : null;
    let items = [];
    if (previewBase) {
      items = previewBase.map((it) => {
        const g = goodsById(it.goodsId) || {};
        return { goodsId: Number(it.goodsId), name: it.name || g.name, pic: it.pic || g.pic, specText: it.specText || '', price: round2(it.price !== undefined ? it.price : (g.minPrice || 0)), count: parseInt(it.count) || 1 };
      });
    } else {
      items = S('carts').filter((it) => it.checked && !it.invalid)
        .map((it) => ({ goodsId: it.goodsId, name: it.name, pic: it.pic, specText: it.specText, price: it.price, count: it.count }));
    }
    if (!items.length) return { __fail: '没有可结算的商品' };
    const addr = q.addressId ? S('addresses').find((a) => a.id === Number(q.addressId)) : (S('addresses').find((a) => a.isDefault) || S('addresses')[0]);
    if (!addr) return { __fail: '请先添加收货地址' };
    if (Number(addr.distanceKm) > shop.deliveryRule.maxKm) return { __fail: '该地址暂不支持配送，请更换地址' };
    const totalAmount = round2(items.reduce((s, it) => s + it.price * it.count, 0));
    let coupon = null;
    let discountAmount = 0;
    if (q.couponId) {
      coupon = S('userCoupons').find((c) => c.id === Number(q.couponId) && c.status === 1) || null;
      if (coupon && totalAmount >= coupon.threshold) {
        discountAmount = coupon.type === 2 ? round2(totalAmount * (100 - coupon.discount) / 100) : coupon.discount;
        discountAmount = Math.min(discountAmount, totalAmount);
        coupon.status = 2;
        persist('userCoupons');
      }
    }
    const freeThreshold = getLevelConf(S('user').level).freeShipThreshold;
    const freight = calcFreight(totalAmount, addr.distanceKm, freeThreshold);
    const orders = S('orders');
    const order = {
      id: nextId(orders),
      orderNo: genOrderNo(),
      status: 1,
      items, totalAmount, discountAmount: round2(discountAmount), freight,
      payAmount: round2(totalAmount - discountAmount + freight),
      couponId: coupon ? coupon.couponId : null,
      couponTitle: coupon ? coupon.name : '',
      payType: Number(q.payType) || 1,
      remark: q.remark || '',
      deliveryDate: q.deliveryDate || todayStr(),
      deliverySlot: q.deliverySlot || '尽快送达（预计45分钟）',
      addressSnapshot: { name: addr.name, phone: addr.phone, full: addr.province + addr.city + addr.district + addr.detail, tag: addr.tag },
      rider: null,
      isReviewed: false,
      createTime: nowStr(),
      timeline: [{ time: nowStr(), status: 1, remark: '订单已创建，等待付款' }]
    };
    orders.unshift(order);
    persist('orders');
    // 从购物车移除已下单条目
    if (String(q.fromCart) !== 'false') {
      const boughtKeys = items.map((it) => it.goodsId + '|' + it.specText + '|' + it.price);
      store.carts = S('carts').filter((it) => !(it.checked && !it.invalid && boughtKeys.indexOf(it.goodsId + '|' + it.specText + '|' + it.price) > -1));
      persist('carts');
    }
    pushMessage(2, '订单创建成功', '您的订单 ' + order.orderNo + ' 已创建，请尽快完成支付（演示环境，不产生真实交易）。', order.id, '/pages/order/detail?id=' + order.id);
    return order;
  }],

  ['GET', /^\/order\/page$/, (q) => {
    const status = Number(q.status) || 0;
    let list = S('orders').slice();
    if (status === 7) list = list.filter((o) => o.status === 5 && !o.isReviewed); // 待评价
    else if (status > 0) list = list.filter((o) => o.status === status);
    list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    const page = paginate(list, q.current, q.size);
    page.records = page.records.map((o) => Object.assign({}, o, { statusText: require('./data/orders.js').STATUS_TEXT[o.status] }));
    return page;
  }],

  ['GET', /^\/order\/detail$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id) || x.orderNo === q.id);
    if (!o) return { __fail: '订单不存在' };
    return Object.assign({}, o, {
      statusText: require('./data/orders.js').STATUS_TEXT[o.status],
      demoTip: '演示环境，不产生真实交易'
    });
  }],

  ['GET', /^\/order\/statusCount$/, () => {
    const orders = S('orders');
    const c = (fn) => orders.filter(fn).length;
    return {
      s1: c((o) => o.status === 1),
      s2: c((o) => o.status === 2),
      s3: c((o) => o.status === 3),
      s4: c((o) => o.status === 4),
      s5: c((o) => o.status === 5),
      review: c((o) => o.status === 5 && !o.isReviewed)
    };
  }],

  /** mock 支付：状态 1→2（页面侧配合 2 秒 loading） */
  ['POST', /^\/order\/pay$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id));
    if (!o) return { __fail: '订单不存在' };
    if (o.status !== 1) return { __fail: '当前状态不可支付' };
    o.status = 2;
    o.payTime = nowStr();
    o.timeline.push({ time: nowStr(), status: 2, remark: '支付成功（Mock 支付，演示环境不产生真实交易），等待门店分拣' });
    persist('orders');
    pushMessage(2, '支付成功', '订单 ' + o.orderNo + ' 支付成功，门店正在为您备货。', o.id, '/pages/order/detail?id=' + o.id);
    return { orderId: o.id, orderNo: o.orderNo, status: o.status, payAmount: o.payAmount };
  }],

  ['POST', /^\/order\/cancel$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id));
    if (!o) return { __fail: '订单不存在' };
    if (o.status !== 1 && o.status !== 2) return { __fail: '当前状态不可取消' };
    o.status = 6;
    o.timeline.push({ time: nowStr(), status: 6, remark: '订单已取消' + (o.status === 2 ? '，退款将于 1-3 个工作日到账' : '') });
    persist('orders');
    if (o.couponId) {
      const c = S('userCoupons').find((x) => x.couponId === o.couponId && x.status === 2);
      if (c) { c.status = 1; persist('userCoupons'); }
    }
    pushMessage(2, '订单已取消', '订单 ' + o.orderNo + ' 已取消。', o.id, '/pages/order/detail?id=' + o.id);
    return { orderId: o.id, status: o.status };
  }],

  /** 模拟配送进度推进：2待发货→3配送中→4待收货→5已完成 */
  ['POST', /^\/order\/advance$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id));
    if (!o) return { __fail: '订单不存在' };
    const RIDERS = [{ name: '陈骑手', phone: '13712345678', avatar: '/static/mock/avatar-3.png' }, { name: '刘骑手', phone: '13698765432', avatar: '/static/mock/avatar-4.png' }, { name: '黄骑手', phone: '13555556666', avatar: '/static/mock/avatar-5.png' }];
    if (o.status === 2) {
      o.status = 3;
      o.rider = RIDERS[o.id % RIDERS.length];
      o.timeline.push({ time: nowStr(), status: 3, remark: '门店已分拣完成，骑手 ' + o.rider.name + ' 已取货，正在配送' });
      pushMessage(2, '订单配送中', '订单 ' + o.orderNo + ' 已由骑手取货，正在飞奔向您。', o.id, '/pages/order/detail?id=' + o.id);
    } else if (o.status === 3) {
      o.status = 4;
      o.timeline.push({ time: nowStr(), status: 4, remark: '商品已送达附近站点，即将为您派送' });
      pushMessage(2, '即将送达', '订单 ' + o.orderNo + ' 即将送达，请保持电话畅通。', o.id, '/pages/order/detail?id=' + o.id);
    } else if (o.status === 4) {
      o.status = 5;
      o.finishTime = nowStr();
      o.timeline.push({ time: nowStr(), status: 5, remark: '订单已送达，感谢惠顾' });
      addPoints(Math.floor(o.payAmount), '订单 ' + o.orderNo + ' 购物奖励', 1);
      const up = addGrowth(Math.floor(o.payAmount));
      pushMessage(2, '订单已完成', '订单 ' + o.orderNo + ' 已完成，获得 ' + Math.floor(o.payAmount) + ' 积分' + (up ? '，恭喜升级为' + up + '！' : '。'), o.id, '/pages/order/detail?id=' + o.id);
    } else {
      return { __fail: '当前状态无法继续推进' };
    }
    persist('orders');
    return Object.assign({}, o, { statusText: require('./data/orders.js').STATUS_TEXT[o.status] });
  }],

  /** 确认收货：3/4 → 5，赠购物积分与成长值 */
  ['POST', /^\/order\/confirm$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id));
    if (!o) return { __fail: '订单不存在' };
    if (o.status !== 3 && o.status !== 4) return { __fail: '当前状态不可确认收货' };
    o.status = 5;
    o.finishTime = nowStr();
    o.timeline.push({ time: nowStr(), status: 5, remark: '用户已确认收货，订单完成' });
    persist('orders');
    addPoints(Math.floor(o.payAmount), '订单 ' + o.orderNo + ' 购物奖励', 1);
    const up = addGrowth(Math.floor(o.payAmount));
    pushMessage(2, '订单已完成', '订单 ' + o.orderNo + ' 已完成，获得 ' + Math.floor(o.payAmount) + ' 积分' + (up ? '，恭喜升级为' + up + '！' : '。'), o.id, '/pages/order/detail?id=' + o.id);
    return { orderId: o.id, status: o.status, points: Math.floor(o.payAmount) };
  }],

  /** 再来一单：已完成订单商品重新加入购物车 */
  ['POST', /^\/order\/rebuy$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.id));
    if (!o) return { __fail: '订单不存在' };
    const carts = S('carts');
    o.items.forEach((it) => {
      const g = goodsById(it.goodsId);
      if (!g) return;
      const exist = carts.find((c) => c.goodsId === it.goodsId && c.specText === it.specText && c.price === it.price && !c.invalid);
      if (exist) exist.count += it.count;
      else carts.push({ id: nextId(carts), goodsId: it.goodsId, name: it.name, pic: it.pic, specText: it.specText, price: it.price, count: it.count, checked: true, stock: g.stock, invalid: false });
    });
    persist('carts');
    pushMessage(2, '再来一单成功', '订单 ' + o.orderNo + ' 的商品已重新加入购物车。', o.id, '/pages/cart/cart');
    return cartSummary();
  }],

  /* ---------- 评价 ---------- */
  ['GET', /^\/review\/goods\/summary$/, (q) => {
    const list = S('reviews').filter((r) => r.goodsId === Number(q.goodsId));
    const avg = list.length ? round2(list.reduce((s, r) => s + r.score, 0) / list.length * 10) / 10 : 5;
    const goodRate = list.length ? Math.round(list.filter((r) => r.score >= 4).length / list.length * 100) : 100;
    const tagCounts = {};
    list.forEach((r) => (r.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const tags = Object.keys(tagCounts).map((t) => ({ tag: t, count: tagCounts[t] })).sort((a, b) => b.count - a.count);
    return { avgScore: avg, total: list.length, goodRate, tags, tagPool: TAG_POOL };
  }],

  ['GET', /^\/review\/goods\/page$/, (q) => {
    let list = S('reviews').slice();
    if (q.goodsId) list = list.filter((r) => r.goodsId === Number(q.goodsId));
    list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    return paginate(list, q.current, q.size);
  }],

  ['POST', /^\/review\/goods\/submit$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.orderId));
    if (!o) return { __fail: '订单不存在' };
    const g = goodsById(q.goodsId);
    if (!g) return { __fail: '商品不存在' };
    const score = Math.min(5, Math.max(1, parseInt(q.score) || 5));
    const images = Array.isArray(q.images) ? q.images.slice(0, 6) : [];
    const reviews = S('reviews');
    reviews.unshift({
      id: nextId(reviews), orderId: o.id, goodsId: g.id,
      userId: S('user').id, userName: S('user').nickName.slice(0, 1) + '***', avatar: S('user').avatar,
      score, tags: q.tags || [], content: q.content || '此用户没有填写评价，默认好评。',
      images, createTime: nowStr()
    });
    persist('reviews');
    o.isReviewed = true;
    persist('orders');
    const pts = images.length ? 30 : 20;
    addPoints(pts, '评价订单 ' + o.orderNo + (images.length ? '（带图）' : ''), 3);
    pushMessage(4, '评价成功', '感谢您的评价，获得 ' + pts + ' 积分！', o.id, '/pages/order/detail?id=' + o.id);
    return { points: pts };
  }],

  ['GET', /^\/review\/shop\/page$/, (q) => {
    const list = S('shopReviews').slice().sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    const page = paginate(list, q.current, q.size);
    const all = S('shopReviews');
    const avgOf = (k) => all.length ? round2(all.reduce((s, r) => s + r.scores[k], 0) / all.length * 10) / 10 : 5;
    page.summary = { fresh: avgOf('fresh'), speed: avgOf('speed'), package: avgOf('package'), total: all.length };
    return page;
  }],

  ['POST', /^\/review\/shop\/submit$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.orderId));
    if (!o) return { __fail: '订单不存在' };
    const scores = q.scores || { fresh: 5, speed: 5, package: 5 };
    const list = S('shopReviews');
    list.unshift({
      id: nextId(list), orderId: o.id, userId: S('user').id,
      userName: S('user').nickName.slice(0, 1) + '***', avatar: S('user').avatar,
      scores: { fresh: Number(scores.fresh) || 5, speed: Number(scores.speed) || 5, package: Number(scores.package) || 5 },
      content: q.content || '此用户没有填写评价，默认好评。',
      createTime: nowStr()
    });
    persist('shopReviews');
    return { ok: true };
  }],

  /* ---------- 用户 / 会员 ---------- */
  ['GET', /^\/user\/info$/, () => {
    const u = deepCopy(S('user'));
    u.couponCount = S('userCoupons').filter((c) => c.status === 1).length;
    u.collectCount = S('collects').length;
    u.footprintCount = S('footprints').length;
    u.unreadMessages = S('messages').filter((m) => !m.isRead).length;
    u.levelName = getLevelConf(u.level).levelName;
    u.levelIcon = getLevelConf(u.level).icon;
    return u;
  }],

  ['POST', /^\/user\/login$/, () => {
    store.user = deepCopy(seedUser);
    persist('user');
    if (hasWx) { try { wx.setStorageSync('userInfo', store.user); } catch (e) { /* ignore */ } }
    return deepCopy(store.user);
  }],

  ['POST', /^\/user\/logout$/, () => {
    if (hasWx) { try { wx.removeStorageSync('userInfo'); } catch (e) { /* ignore */ } }
    return { ok: true };
  }],

  /** mock 换头像：循环使用本地头像 */
  ['POST', /^\/user\/updateAvatar$/, (q) => {
    const u = S('user');
    if (q.avatar) u.avatar = q.avatar;
    else {
      const idx = [1, 2, 3, 4, 5, 6].find((n) => u.avatar.indexOf('avatar-' + n) > -1) || 0;
      u.avatar = '/static/mock/avatar-' + (idx % 6 + 1) + '.png';
    }
    persist('user');
    if (hasWx) { try { wx.setStorageSync('userInfo', u); } catch (e) { /* ignore */ } }
    return { avatar: u.avatar };
  }],

  ['GET', /^\/member\/info$/, () => {
    const u = S('user');
    const conf = getLevelConf(u.level);
    const next = getLevelConf(Math.min(5, u.level + 1));
    const span = Math.max(1, next.growth - conf.growth);
    const percent = u.level >= 5 ? 100 : Math.min(100, Math.round((u.growthValue - conf.growth) / span * 100));
    const nowMonth = new Date().getMonth() + 1;
    const birthMonth = Number(String(u.birthday).slice(5, 7));
    const birthday = {
      isBirthdayMonth: nowMonth === birthMonth,
      received: !!u.birthdayReceived,
      gifts: conf.privileges.filter((p) => p.indexOf('生日') > -1)
    };
    return {
      userId: u.id, level: u.level, levelName: conf.levelName, levelIcon: conf.icon,
      growthValue: u.growthValue, nextLevelGrowth: next.growth, progress: percent,
      points: u.points, validDate: u.memberExpire || '2027-08-08',
      discountText: conf.discountText, freeShipThreshold: conf.freeShipThreshold,
      privileges: conf.privileges, birthday
    };
  }],

  ['GET', /^\/member\/levels$/, () => ({ levels, currentLevel: S('user').level, growthValue: S('user').growthValue })],

  /** 生日礼包领取（生日月自动可领） */
  ['POST', /^\/member\/birthday\/receive$/, () => {
    const u = S('user');
    const nowMonth = new Date().getMonth() + 1;
    const birthMonth = Number(String(u.birthday).slice(5, 7));
    if (nowMonth !== birthMonth) return { __fail: '生日月才可领取礼包哦（可在设置中把生日改为本月体验）' };
    if (u.birthdayReceived) return { __fail: '本年度礼包已领取' };
    u.birthdayReceived = true;
    persist('user');
    const conf = getLevelConf(u.level);
    const coupons = S('userCoupons');
    coupons.unshift({ id: nextId(coupons), couponId: 107, name: '生日满88减15', type: 1, threshold: 88, discount: 15, scope: '全场通用', status: 1, expireTime: todayStr().slice(0, 8) + pad(new Date().getDate()) + ' 23:59', source: '生日赠送' });
    persist('userCoupons');
    addPoints(100, '生日礼包积分赠送', 5);
    pushMessage(3, '生日礼包已到账', '祝您生日快乐！' + conf.levelName + '生日礼包：满88减15券 + 100 积分已发放。', null, '/pages/coupon/coupon?tab=mine');
    return { ok: true, msg: '生日礼包领取成功：满88减15优惠券 + 100 积分' };
  }],

  /* ---------- 签到 ---------- */
  ['GET', /^\/checkin\/info$/, () => {
    const c = S('checkin');
    const d = new Date();
    // 跨月重置
    const monthKey = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    if (c.month !== monthKey) {
      c.month = monthKey;
      c.monthRecords = [];
      c.continuousDays = 0;
      persist('checkin');
    }
    const today = d.getDate();
    c.todaySigned = c.monthRecords.indexOf(today) > -1;
    return {
      continuousDays: c.continuousDays,
      todaySigned: c.todaySigned,
      monthRecords: c.monthRecords,
      month: c.month,
      year: d.getFullYear(),
      monthNum: d.getMonth() + 1,
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      today,
      rewards: checkinRewards,
      nextReward: checkinRewards[c.continuousDays % 7],
      totalPoints: S('user').points,
      rules: checkinRules
    };
  }],

  ['POST', /^\/checkin\/sign$/, () => {
    const c = S('checkin');
    const d = new Date();
    const today = d.getDate();
    if (c.monthRecords.indexOf(today) > -1) return { __fail: '今天已签到，明天再来吧' };
    const yesterday = new Date(Date.now() - 86400000).getDate();
    c.continuousDays = (c.monthRecords.indexOf(yesterday) > -1 || c.continuousDays === 0 || c.monthRecords.length === 0) ? c.continuousDays + 1 : 1;
    if (c.monthRecords.indexOf(yesterday) === -1 && c.monthRecords.length > 0) c.continuousDays = 1;
    c.monthRecords.push(today);
    c.monthRecords.sort((a, b) => a - b);
    persist('checkin');
    const pts = checkinRewards[(c.continuousDays - 1) % 7];
    addPoints(pts, c.continuousDays % 7 === 0 ? '连续签到第 7 天大奖' : '每日签到（连签 ' + c.continuousDays + ' 天）', 2);
    addGrowth(2);
    pushMessage(4, '签到成功', '签到 +' + pts + ' 积分，已连续签到 ' + c.continuousDays + ' 天。', null, '/pages/member/checkin/checkin');
    return { points: pts, continuousDays: c.continuousDays, todaySigned: true, monthRecords: c.monthRecords, totalPoints: S('user').points };
  }],

  /* ---------- 积分 ---------- */
  ['GET', /^\/points\/page$/, (q) => {
    const list = S('pointsRecords').slice();
    const page = paginate(list, q.current, q.size);
    page.totalPoints = S('user').points;
    page.typeText = TYPE_TEXT;
    return page;
  }],

  ['GET', /^\/points\/exchange$/, () => ({ goods: exchangeGoods, totalPoints: S('user').points, rules: pointsRules })],

  ['POST', /^\/points\/exchange\/do$/, (q) => {
    const eg = exchangeGoods.find((x) => x.id === Number(q.id));
    if (!eg) return { __fail: '兑换商品不存在' };
    if (eg.stock <= 0) return { __fail: '已被兑完' };
    const u = S('user');
    if (u.points < eg.points) return { __fail: '积分不足，去签到/购物赚积分吧' };
    eg.stock -= 1;
    addPoints(-eg.points, '兑换 ' + eg.name, 4);
    if (eg.type === 'coupon') {
      const coupons = S('userCoupons');
      coupons.unshift({
        id: nextId(coupons), couponId: 200 + eg.id, name: eg.name, type: eg.discount >= 100 ? 3 : 1,
        threshold: eg.name.indexOf('满59') > -1 ? 59 : (eg.name.indexOf('满199') > -1 ? 199 : 0),
        discount: parseInt(eg.name) || 5, scope: '全场通用', status: 1,
        expireTime: new Date(Date.now() + 15 * 86400000).getFullYear() + '-' + pad(new Date(Date.now() + 15 * 86400000).getMonth() + 1) + '-' + pad(new Date(Date.now() + 15 * 86400000).getDate()) + ' 23:59',
        source: '积分兑换'
      });
      persist('userCoupons');
    } else {
      pushMessage(2, '兑换成功', '您兑换的「' + eg.name + '」将随下一笔订单一起配送（演示环境）。', null);
    }
    return { ok: true, totalPoints: S('user').points, msg: '兑换成功：' + eg.name };
  }],

  /* ---------- 优惠券 ---------- */
  ['GET', /^\/coupon\/available$/, () => {
    const mine = S('userCoupons');
    return couponTemplates.map((t) => Object.assign({}, t, {
      received: mine.some((c) => c.couponId === t.id && c.status === 1)
    }));
  }],

  ['GET', /^\/coupon\/mine$/, (q) => {
    let list = S('userCoupons').slice();
    const status = Number(q.status) || 0;
    if (status > 0) list = list.filter((c) => c.status === status);
    list.sort((a, b) => a.status - b.status);
    return list;
  }],

  ['GET', /^\/coupon\/usable$/, (q) => {
    const amount = Number(q.amount) || 0;
    return S('userCoupons').filter((c) => c.status === 1 && amount >= c.threshold);
  }],

  ['GET', /^\/coupon\/best$/, (q) => pickBestCoupon(S('userCoupons'), Number(q.amount) || 0)],

  ['POST', /^\/coupon\/receive$/, (q) => {
    const t = couponTemplates.find((x) => x.id === Number(q.id));
    if (!t) return { __fail: '优惠券不存在' };
    const mine = S('userCoupons');
    if (mine.some((c) => c.couponId === t.id && c.status === 1)) return { __fail: '已领取过该优惠券' };
    if (t.stock <= 0) return { __fail: '优惠券已被领完' };
    t.stock -= 1;
    t.received += 1;
    const d = new Date(Date.now() + t.expireDays * 86400000);
    mine.unshift({
      id: nextId(mine), couponId: t.id, name: t.name, type: t.type, threshold: t.threshold,
      discount: t.discount, scope: t.scope, status: 1,
      expireTime: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' 23:59',
      source: '领取'
    });
    persist('userCoupons');
    pushMessage(3, '优惠券到账', '「' + t.name + '」已到账，有效期至 ' + (d.getMonth() + 1) + '月' + d.getDate() + '日。', null, '/pages/coupon/coupon?tab=mine');
    return { ok: true, msg: '领取成功' };
  }],

  /* ---------- 促销 / 拼团 ---------- */
  ['GET', /^\/promotion\/current$/, () => promotions.map((p) => Object.assign({}, p, {
    remainSeconds: Math.max(0, Math.floor((p.endTimestamp - Date.now()) / 1000)),
    goodsList: p.seckillGoods ? p.seckillGoods.map((s) => {
      const g = goodsById(s.goodsId);
      return g ? Object.assign({}, s, { name: g.name, pic: g.pic, unit: g.unit }) : null;
    }).filter(Boolean) : undefined
  }))],

  ['POST', /^\/promotion\/remind$/, (q) => {
    const p = promotions.find((x) => x.id === Number(q.id || 1)) || promotions[0];
    pushMessage(3, '秒杀开场提醒已设置', '「' + p.title + '」开场前将通过消息中心通知您，记得准时来抢哦～', p.id, '/pages/promotion/seckill');
    return { ok: true, msg: '已设置开场提醒' };
  }],

  ['GET', /^\/group\/list$/, () => {
    groupExpireSweep();
    return {
      groups: S('groups').map((gp) => Object.assign({}, gp, { remainSeconds: Math.max(0, Math.floor((gp.endTimestamp - Date.now()) / 1000)) })),
      wholesales
    };
  }],

  ['GET', /^\/group\/detail$/, (q) => {
    groupExpireSweep();
    const gp = S('groups').find((x) => x.id === Number(q.id));
    if (!gp) return { __fail: '拼团不存在' };
    const g = goodsById(gp.goodsId);
    return Object.assign({}, gp, {
      goods: g,
      remainSeconds: Math.max(0, Math.floor((gp.endTimestamp - Date.now()) / 1000)),
      myOrders: S('orders').filter((o) => o.remark && o.remark.indexOf('拼团订单 #' + gp.id) > -1).map((o) => ({ id: o.id, orderNo: o.orderNo, status: o.status }))
    });
  }],

  ['GET', /^\/group\/mine$/, () => {
    groupExpireSweep();
    return S('groups').filter((gp) => [1, 4].indexOf(gp.id) > -1 || gp.isMine)
      .map((gp) => Object.assign({}, gp, { remainSeconds: Math.max(0, Math.floor((gp.endTimestamp - Date.now()) / 1000)) }));
  }],

  /** 开团：创建新团（本人为团长）并生成拼团订单 */
  ['POST', /^\/group\/create$/, (q) => {
    const g = goodsById(q.goodsId);
    if (!g) return { __fail: '商品不存在' };
    const groups = S('groups');
    const count = Math.max(1, parseInt(q.count) || 1);
    const specText = q.specText || g.specs[0].values[0].label;
    const endTs = Date.now() + 24 * 3600000;
    const end = new Date(endTs);
    const gp = {
      id: nextId(groups), goodsId: g.id, name: g.name, pic: g.pic,
      groupPrice: round2(g.minPrice * 0.85), originalPrice: g.minPrice,
      requiredCount: 3, joinedCount: 1, status: 1,
      endTime: end.getFullYear() + '-' + pad(end.getMonth() + 1) + '-' + pad(end.getDate()) + ' ' + pad(end.getHours()) + ':' + pad(end.getMinutes()),
      endTimestamp: endTs,
      members: [{ avatar: S('user').avatar, name: S('user').nickName.slice(0, 2) + '***', isLeader: true }],
      rules: ['3 人成团，团长享额外 95 折', '24 小时未成团自动退款', '每个账号同一团仅限参团 1 次'],
      isMine: true
    };
    groups.unshift(gp);
    persist('groups');
    const order = createGroupOrder(gp, count, specText);
    pushMessage(2, '开团成功', '您发起的「' + g.name + '」拼团已创建，快邀请好友参团吧（演示环境，不产生真实交易）。', gp.id, '/pages/group/detail?id=' + gp.id);
    return { group: Object.assign({}, gp, { remainSeconds: 86400 }), order };
  }],

  ['POST', /^\/group\/join$/, (q) => {
    groupExpireSweep();
    const gp = S('groups').find((x) => x.id === Number(q.id));
    if (!gp) return { __fail: '拼团不存在' };
    if (gp.status !== 1) return { __fail: '该团已结束' };
    if (gp.joinedCount >= gp.requiredCount) return { __fail: '该团已满' };
    const count = Math.max(1, parseInt(q.count) || 1);
    gp.joinedCount += 1;
    gp.members.push({ avatar: S('user').avatar, name: S('user').nickName.slice(0, 2) + '***', isLeader: false });
    gp.isMine = true;
    if (gp.joinedCount >= gp.requiredCount) {
      gp.status = 2;
      pushMessage(2, '拼团成功', '「' + gp.name + '」拼团成功，将尽快为您安排配送。', gp.id, '/pages/group/detail?id=' + gp.id);
    }
    persist('groups');
    const order = createGroupOrder(gp, count, q.specText);
    return {
      group: Object.assign({}, gp, { remainSeconds: Math.max(0, Math.floor((gp.endTimestamp - Date.now()) / 1000)) }),
      order,
      msg: gp.status === 2 ? '拼团成功！订单已生成，请尽快付款' : '参团成功，还差 ' + (gp.requiredCount - gp.joinedCount) + ' 人成团' + (order ? '，订单已生成' : '')
    };
  }],

  /* ---------- 分享裂变 ---------- */
  ['POST', /^\/share\/reward$/, (q) => {
    const u = S('user');
    const today = todayStr();
    if (!u.shareLog || u.shareLog.date !== today) u.shareLog = { date: today, count: 0 };
    if (u.shareLog.count >= 3) return { __fail: '今日分享积分已达上限（3 次/天）' };
    u.shareLog.count += 1;
    persist('user');
    addPoints(5, (String(q.type) === 'group' ? '分享拼团' : '分享商品') + '奖励', 6);
    return { points: 5, remainToday: 3 - u.shareLog.count };
  }],

  ['POST', /^\/invite\/reward$/, () => {
    const u = S('user');
    const today = todayStr();
    if (u.lastInviteDate === today) return { __fail: '今日已获得邀请奖励，明天再来' };
    u.lastInviteDate = today;
    persist('user');
    const coupons = S('userCoupons');
    const d = new Date(Date.now() + 15 * 86400000);
    coupons.unshift({
      id: nextId(coupons), couponId: 108, name: '邀新满39减8', type: 1, threshold: 39, discount: 8,
      scope: '全场通用', status: 1,
      expireTime: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' 23:59',
      source: '邀请奖励'
    });
    persist('userCoupons');
    pushMessage(3, '邀请奖励到账', '您邀请的好友已成功下单，满39减8 优惠券已到账（演示环境）。', null, '/pages/coupon/coupon?tab=mine');
    return { ok: true, couponName: '满39减8', msg: '邀请成功，满39减8 优惠券已到账' };
  }],

  /* ---------- 消息 ---------- */
  ['GET', /^\/message\/list$/, (q) => {
    let list = S('messages').slice();
    const type = Number(q.type) || 0;
    if (type > 0) list = list.filter((m) => m.type === type);
    return list.map((m) => Object.assign({}, m, {
      typeText: MSG_TYPE_TEXT[m.type],
      link: m.link || (m.type === 2 && m.relatedId ? '/pages/order/detail?id=' + m.relatedId : '')
    }));
  }],

  ['GET', /^\/message\/unread$/, () => ({ count: S('messages').filter((m) => !m.isRead).length })],

  ['POST', /^\/message\/read$/, (q) => {
    const m = S('messages').find((x) => x.id === Number(q.id));
    if (m) m.isRead = true;
    persist('messages');
    return { count: S('messages').filter((x) => !x.isRead).length };
  }],

  ['POST', /^\/message\/readAll$/, () => {
    S('messages').forEach((m) => { m.isRead = true; });
    persist('messages');
    return { count: 0 };
  }],

  /* ---------- 店铺 ---------- */
  ['GET', /^\/shop\/info$/, () => Object.assign({}, shop, {
    shopReviewSummary: {
      fresh: shop.subScores.fresh, speed: shop.subScores.speed, package: shop.subScores.package,
      total: S('shopReviews').length, score: shop.score
    }
  })],

  ['GET', /^\/shop\/freight$/, (q) => {
    const addr = q.addressId ? S('addresses').find((a) => a.id === Number(q.addressId)) : null;
    const km = addr ? addr.distanceKm : Number(q.distanceKm || 0);
    const freeThreshold = getLevelConf(S('user').level).freeShipThreshold;
    const outOfRange = km > shop.deliveryRule.maxKm;
    const freight = calcFreight(Number(q.amount) || 0, km, freeThreshold);
    return { freight, rule: shop.deliveryRule, freeThreshold, deliveryText: shop.deliveryText, distanceKm: km, outOfRange };
  }],

  /* ---------- 客服与售后 ---------- */
  ['GET', /^\/service\/start$/, () => ({ welcome: service.welcome, hotQuestions: service.hotQuestions })],

  ['POST', /^\/service\/reply$/, (q) => {
    const question = String(q.question || '');
    let answer = service.defaultAnswer;
    let matched = false;
    for (let i = 0; i < service.qaRules.length; i++) {
      const rule = service.qaRules[i];
      if (rule.keywords.some((k) => question.toLowerCase().indexOf(k.toLowerCase()) > -1)) {
        answer = rule.answer;
        matched = true;
        break;
      }
    }
    return { answer, matched };
  }],

  ['POST', /^\/service\/rate$/, (q) => {
    const svc = S('service');
    const clamp = (v) => Math.min(5, Math.max(1, parseInt(v) || 5));
    svc.serviceReviews.unshift({
      id: nextId(svc.serviceReviews), speed: clamp(q.speed), solve: clamp(q.solve),
      content: q.content || '', createTime: nowStr()
    });
    persist('service');
    return { ok: true, msg: '感谢您的评价！' };
  }],

  ['GET', /^\/aftersale\/reasons$/, () => ({ reasons: service.aftersaleReasons, typeText: service.TYPE_TEXT, statusText: service.STATUS_TEXT })],

  ['POST', /^\/aftersale\/apply$/, (q) => {
    const o = S('orders').find((x) => x.id === Number(q.orderId));
    if (!o) return { __fail: '订单不存在' };
    const type = [1, 2, 3].indexOf(Number(q.type)) > -1 ? Number(q.type) : 1;
    if (!q.reason) return { __fail: '请选择售后原因' };
    const svc = S('service');
    const firstGoods = o.items[0] || {};
    const ticket = {
      id: nextId(svc.tickets), orderId: o.id, orderNo: o.orderNo,
      goodsName: firstGoods.name || '', goodsPic: firstGoods.pic || '',
      type, reason: q.reason, desc: q.desc || '',
      images: Array.isArray(q.images) ? q.images.slice(0, 6) : [],
      status: 1, refundAmount: type === 3 ? 0 : o.payAmount,
      createTime: nowStr(),
      timeline: [{ time: nowStr(), status: 1, statusText: '待审核', remark: '售后申请已提交，商家将在 24 小时内处理' }]
    };
    svc.tickets.unshift(ticket);
    persist('service');
    o.afterSale = { ticketId: ticket.id, type, status: 1 };
    o.timeline.push({ time: nowStr(), status: o.status, remark: '提交售后申请：' + service.TYPE_TEXT[type] + '（' + q.reason + '）' });
    persist('orders');
    pushMessage(2, '售后申请已提交', '订单 ' + o.orderNo + ' 的售后申请（' + service.TYPE_TEXT[type] + '）已提交，商家将尽快审核。', o.id, '/pages/service/tickets?id=' + ticket.id);
    return Object.assign({}, ticket, { typeText: service.TYPE_TEXT[type], statusText: service.STATUS_TEXT[1] });
  }],

  ['GET', /^\/aftersale\/page$/, (q) => {
    let list = S('service').tickets.slice();
    const status = Number(q.status) || 0;
    if (status > 0) list = list.filter((t) => t.status === status);
    list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    const page = paginate(list, q.current, q.size);
    page.records = page.records.map((t) => Object.assign({}, t, { typeText: service.TYPE_TEXT[t.type], statusText: service.STATUS_TEXT[t.status] }));
    return page;
  }],

  ['GET', /^\/aftersale\/detail$/, (q) => {
    const t = S('service').tickets.find((x) => x.id === Number(q.id));
    if (!t) return { __fail: '售后工单不存在' };
    const o = S('orders').find((x) => x.id === t.orderId);
    return Object.assign({}, t, {
      typeText: service.TYPE_TEXT[t.type],
      statusText: service.STATUS_TEXT[t.status],
      order: o ? { id: o.id, orderNo: o.orderNo, status: o.status, payAmount: o.payAmount, items: o.items } : null
    });
  }],

  /** 售后状态推进（演示入口）：待审核→处理中→已完成 */
  ['POST', /^\/aftersale\/advance$/, (q) => {
    const t = S('service').tickets.find((x) => x.id === Number(q.id));
    if (!t) return { __fail: '售后工单不存在' };
    const FLOW = {
      1: { next: 2, remark: t.type === 1 ? '商家已同意退款，正在为您办理' : (t.type === 2 ? '商家已同意退货，请按寄回地址寄回商品' : '商家已同意换货，正在为您安排') },
      2: { next: 3, remark: t.type === 1 ? '退款已原路退回，预计 1-3 个工作日到账（演示环境）' : (t.type === 2 ? '退货已签收，退款已原路退回（演示环境）' : '换货商品已发出，请注意查收') }
    };
    const step = FLOW[t.status];
    if (!step) return { __fail: '当前状态无法继续推进' };
    t.status = step.next;
    t.timeline.push({ time: nowStr(), status: t.status, statusText: service.STATUS_TEXT[t.status], remark: step.remark });
    persist('service');
    const o = S('orders').find((x) => x.id === t.orderId);
    if (o) {
      if (o.afterSale) o.afterSale.status = t.status;
      o.timeline.push({ time: nowStr(), status: o.status, remark: '售后进度：' + service.STATUS_TEXT[t.status] + '，' + step.remark });
      persist('orders');
    }
    pushMessage(2, '售后进度更新', '订单 ' + t.orderNo + ' 的售后申请已更新为「' + service.STATUS_TEXT[t.status] + '」。', t.orderId, '/pages/service/tickets?id=' + t.id);
    return Object.assign({}, t, { typeText: service.TYPE_TEXT[t.type], statusText: service.STATUS_TEXT[t.status] });
  }],

  ['POST', /^\/aftersale\/cancel$/, (q) => {
    const t = S('service').tickets.find((x) => x.id === Number(q.id));
    if (!t) return { __fail: '售后工单不存在' };
    if (t.status !== 1 && t.status !== 2) return { __fail: '当前状态不可撤销' };
    t.status = 5;
    t.timeline.push({ time: nowStr(), status: 5, statusText: '已撤销', remark: '用户已撤销售后申请' });
    persist('service');
    const o = S('orders').find((x) => x.id === t.orderId);
    if (o) {
      if (o.afterSale) o.afterSale.status = 5;
      o.timeline.push({ time: nowStr(), status: o.status, remark: '售后申请已撤销' });
      persist('orders');
    }
    pushMessage(2, '售后已撤销', '订单 ' + t.orderNo + ' 的售后申请已撤销。', t.orderId, '/pages/order/detail?id=' + t.orderId);
    return Object.assign({}, t, { typeText: service.TYPE_TEXT[t.type], statusText: service.STATUS_TEXT[5] });
  }],

  /* ---------- 调试 ---------- */
  ['POST', /^\/debug\/reset$/, () => { resetAll(); return { ok: true }; }]
];

/* ==================== 分发入口 ==================== */

/**
 * Mock 请求分发
 * @param {string} url 接口路径（不含域名，可带 query）
 * @param {string} method GET/POST
 * @param {object} data 参数
 * @returns {Promise<{code:number,data:any,msg:string}>}
 */
function handle(url, method, data) {
  method = (method || 'GET').toUpperCase();
  let path = String(url || '');
  let query = {};
  const qi = path.indexOf('?');
  if (qi > -1) {
    path.slice(qi + 1).split('&').forEach((kv) => {
      const p = kv.split('=');
      if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    path = path.slice(0, qi);
  }
  const params = Object.assign({}, query, data || {});

  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    if (r[0] !== method && r[0] !== '*') continue;
    if (!r[1].test(path)) continue;
    let result;
    try {
      result = r[2](params, path);
    } catch (e) {
      console.error('[mock] handler error:', path, e);
      return mockError('服务异常：' + (e && e.message ? e.message : '未知错误'), 500);
    }
    if (result && result.__fail) return mockError(result.__fail, 400);
    return mockResponse(result === undefined ? null : result);
  }
  console.warn('[mock] 未匹配的接口:', method, path);
  return mockError('接口不存在: ' + method + ' ' + path, 404);
}

module.exports = { handle, resetAll, store, S };
