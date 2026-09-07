// mock/store.js —— 模块级内存数据库 + wx.storage 持久化
// 写操作（加购/下单/领券/签到/评价等）真实生效并跨页面保持一致
const goodsList = require('./data/goods');
const categories = require('./data/categories');
const { defaultUser } = require('./data/user');
const addressSeed = require('./data/addresses');
const { buildInitialCart } = require('./data/carts');
const { buildInitialOrders } = require('./data/orders');
const { buildMyCoupons } = require('./data/coupons');
const { recordsSeed } = require('./data/points');
const { buildMyGroups } = require('./data/groups');
const messageSeed = require('./data/messages');
const { buildInitialTickets } = require('./data/afterSales');
const { fmtDate, pad } = require('./util');

const KEY = {
  USER: 'mock_user',
  CART: 'mock_cart',
  ADDRESS: 'mock_addresses',
  ORDER: 'mock_orders',
  POINTS: 'mock_points_records',
  COUPON: 'mock_coupons_mine',
  COLLECT: 'mock_collects',
  FOOTPRINT: 'mock_footprints',
  GROUP: 'mock_my_groups',
  MSG: 'mock_messages',
  AFTERSALE: 'mock_aftersales',
  SHARE: 'mock_share_counter',
  INVITE: 'mock_invite_rewarded',
  SEQ: 'mock_seq',
  CHECKIN_PREFIX: 'mock_checkin_'
};

function get(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    if (v === '' || v === null || v === undefined) return fallback;
    return v;
  } catch (e) {
    return fallback;
  }
}

function set(key, val) {
  try {
    wx.setStorageSync(key, val);
  } catch (e) { /* ignore */ }
  return val;
}

function remove(key) {
  try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
}

// ---- 序号生成（购物车项 id 等）----
function nextSeq(name) {
  const all = get(KEY.SEQ, {});
  all[name] = (all[name] || 10000) + 1;
  set(KEY.SEQ, all);
  return all[name];
}

// ---- 初始化（仅首次写入）----
function init() {
  if (get(KEY.USER, null) === null) set(KEY.USER, Object.assign({}, defaultUser));
  if (get(KEY.CART, null) === null) set(KEY.CART, buildInitialCart(goodsList));
  if (get(KEY.ADDRESS, null) === null) set(KEY.ADDRESS, addressSeed.slice());
  if (get(KEY.ORDER, null) === null) set(KEY.ORDER, buildInitialOrders(goodsList));
  if (get(KEY.COUPON, null) === null) set(KEY.COUPON, buildMyCoupons());
  if (get(KEY.POINTS, null) === null) set(KEY.POINTS, recordsSeed.slice().reverse());
  if (get(KEY.COLLECT, null) === null) set(KEY.COLLECT, [5, 21]);
  if (get(KEY.FOOTPRINT, null) === null) {
    const now = Date.now();
    set(KEY.FOOTPRINT, [
      { goodsId: 13, time: fmtDate(new Date(now - 3600000)) },
      { goodsId: 9, time: fmtDate(new Date(now - 7200000)) },
      { goodsId: 18, time: fmtDate(new Date(now - 86400000)) }
    ]);
  }
  if (get(KEY.GROUP, null) === null) set(KEY.GROUP, buildMyGroups(goodsList));
  if (get(KEY.MSG, null) === null) {
    set(KEY.MSG, messageSeed.map((m) => Object.assign({}, m)));
  }
  if (get(KEY.AFTERSALE, null) === null) set(KEY.AFTERSALE, buildInitialTickets(goodsList));
  if (get(KEY.SHARE, null) === null) set(KEY.SHARE, {});
  if (get(KEY.INVITE, null) === null) set(KEY.INVITE, { rewarded: false });
}

// 清空用户数据并重新播种（设置页“清除缓存”）
function reset() {
  Object.keys(KEY).forEach((k) => {
    if (k === 'CHECKIN_PREFIX') return;
    remove(KEY[k]);
  });
  // 清理签到月缓存
  try {
    const info = wx.getStorageInfoSync();
    (info.keys || []).forEach((k) => {
      if (k.indexOf(KEY.CHECKIN_PREFIX) === 0) remove(k);
    });
  } catch (e) { /* ignore */ }
  init();
}

// ---- 用户 ----
function getUser() { return get(KEY.USER, Object.assign({}, defaultUser)); }
function setUser(patch) {
  const u = Object.assign(getUser(), patch);
  set(KEY.USER, u);
  return u;
}

// ---- 购物车 ----
function getCart() { return get(KEY.CART, []); }
function saveCart(list) { return set(KEY.CART, list); }

// ---- 地址 ----
function getAddresses() { return get(KEY.ADDRESS, []); }
function saveAddresses(list) { return set(KEY.ADDRESS, list); }

// ---- 订单 ----
function getOrders() { return get(KEY.ORDER, []); }
function saveOrders(list) { return set(KEY.ORDER, list); }
function findOrder(id) {
  return getOrders().find((o) => String(o.id) === String(id) || String(o.orderNo) === String(id));
}

// ---- 积分 ----
function getPointsRecords() { return get(KEY.POINTS, []); }
function addPointsRecord(rec) {
  const list = getPointsRecords();
  list.unshift(rec);
  set(KEY.POINTS, list);
}
function changePoints(delta) {
  const u = getUser();
  u.points = Math.max(0, u.points + delta);
  setUser(u);
  return u.points;
}
function changeGrowth(delta) {
  const u = getUser();
  u.growthValue = Math.max(0, u.growthValue + delta);
  setUser(u);
  return u.growthValue;
}

// ---- 优惠券 ----
function getMyCoupons() { return get(KEY.COUPON, []); }
function saveMyCoupons(list) { return set(KEY.COUPON, list); }

// ---- 收藏 ----
function getCollects() { return get(KEY.COLLECT, []); }
function isCollect(goodsId) { return getCollects().indexOf(Number(goodsId)) !== -1; }
function toggleCollect(goodsId) {
  goodsId = Number(goodsId);
  const list = getCollects();
  const i = list.indexOf(goodsId);
  if (i === -1) list.unshift(goodsId); else list.splice(i, 1);
  set(KEY.COLLECT, list);
  return i === -1; // true=已收藏
}

// ---- 足迹 ----
function getFootprints() { return get(KEY.FOOTPRINT, []); }
function addFootprint(goodsId) {
  goodsId = Number(goodsId);
  const today = fmtDate(new Date());
  let list = getFootprints().filter((f) => !(f.goodsId === goodsId && f.time === today));
  list.unshift({ goodsId, time: today });
  list = list.slice(0, 200);
  set(KEY.FOOTPRINT, list);
}
function clearFootprints() { set(KEY.FOOTPRINT, []); }

// ---- 拼团 ----
function getMyGroups() { return get(KEY.GROUP, []); }
function addMyGroups(group) {
  const list = getMyGroups();
  list.unshift(group);
  set(KEY.GROUP, list);
}

// ---- 消息（storage 持久化）----
function getMessages() { return get(KEY.MSG, []); }
function addMessage(msg) {
  const list = getMessages();
  list.unshift(Object.assign({
    id: nextSeq('message'),
    isRead: false,
    createTime: require('./util').fmtTime(new Date()),
    relatedId: 0,
    biz: ''
  }, msg));
  set(KEY.MSG, list.slice(0, 100));
  return list[0];
}
function markMessageRead(id) {
  const list = getMessages();
  let changed = false;
  list.forEach((m) => {
    if (id === undefined || id === null || id === '' || String(m.id) === String(id)) {
      if (!m.isRead) { m.isRead = true; changed = true; }
    }
  });
  if (changed) set(KEY.MSG, list);
}
function unreadMessageCount() {
  return getMessages().filter((m) => !m.isRead).length;
}

// ---- 售后工单 ----
function getTickets() { return get(KEY.AFTERSALE, []); }
function saveTickets(list) { return set(KEY.AFTERSALE, list); }
function findTicket(id) {
  return getTickets().find((t) => String(t.id) === String(id));
}

// ---- 分享计数 / 邀新标记 ----
function getShareCounter() { return get(KEY.SHARE, {}); }
function bumpShareCounter(day) {
  const counter = getShareCounter();
  counter[day] = (counter[day] || 0) + 1;
  set(KEY.SHARE, counter);
  return counter[day];
}
function isInviteRewarded() { return !!get(KEY.INVITE, {}).rewarded; }
function markInviteRewarded() { set(KEY.INVITE, { rewarded: true }); }

// ---- 签到（按月存储）----
function checkinKey() {
  const d = new Date();
  return KEY.CHECKIN_PREFIX + d.getFullYear() + '-' + pad(d.getMonth() + 1);
}
function getCheckin() {
  const d = new Date();
  const today = d.getDate();
  let state = get(checkinKey(), null);
  if (state === null) {
    // 默认前两天已签，方便演示连续签到
    const days = [];
    if (today > 2) days.push(today - 2, today - 1);
    else if (today > 1) days.push(today - 1);
    state = { monthRecords: days, continuousDays: days.length, todaySigned: false };
    set(checkinKey(), state);
  }
  return state;
}
function saveCheckin(state) { set(checkinKey(), state); }

module.exports = {
  KEY,
  init,
  reset,
  nextSeq,
  getUser,
  setUser,
  getCart,
  saveCart,
  getAddresses,
  saveAddresses,
  getOrders,
  saveOrders,
  findOrder,
  getPointsRecords,
  addPointsRecord,
  changePoints,
  changeGrowth,
  getMyCoupons,
  saveMyCoupons,
  getCollects,
  isCollect,
  toggleCollect,
  getFootprints,
  addFootprint,
  clearFootprints,
  getMyGroups,
  addMyGroups,
  getMessages,
  addMessage,
  markMessageRead,
  unreadMessageCount,
  getTickets,
  saveTickets,
  findTicket,
  getShareCounter,
  bumpShareCounter,
  isInviteRewarded,
  markInviteRewarded,
  getCheckin,
  saveCheckin,
  goodsList,
  categories
};
