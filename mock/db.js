// mock/db.js —— 内存数据库（结合 wx.setStorageSync 持久化）
// 写操作在内存中真实生效并落盘，跨页面保持一致；升级 SCHEMA 后自动重置种子数据
const seedCarts = require('./data/carts.js')
const seedAddresses = require('./data/addresses.js')
const seedOrders = require('./data/orders.js')
const seedCoupons = require('./data/coupons.js')
const seedPoints = require('./data/points.js')
const seedMessages = require('./data/messages.js')
const seedReviews = require('./data/reviews.js')
const seedShopReviews = require('./data/shopReviews.js')
const seedGroups = require('./data/groups.js')
const { user } = require('./data/user.js')
const { daysAgo, fmt, fmtDay } = require('./util.js')

const STORAGE_KEY = 'snack_shop_db_v1'
const SCHEMA = 'v1.1'

function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

function seedCheckin() {
  // 默认补签本月前几天，便于演示连签（今天前 1~5 天已签）
  const now = new Date()
  const ym = now.getFullYear() + '-' + (now.getMonth() + 1)
  const today = now.getDate()
  const records = []
  const n = Math.min(today - 1, 5)
  for (let i = 1; i <= n; i++) records.push(i)
  return {
    yearMonth: ym,
    records: records,
    continuousDays: n,
    todaySigned: false,
    lastSignDay: today - 1
  }
}

function seedFootprints() {
  return [
    { goodsId: 23, time: fmt(daysAgo(0, 9, 30)) },
    { goodsId: 17, time: fmt(daysAgo(0, 9, 0)) },
    { goodsId: 5, time: fmt(daysAgo(1, 21, 10)) },
    { goodsId: 9, time: fmt(daysAgo(2, 19, 40)) }
  ]
}

function buildSeed() {
  return {
    version: SCHEMA,
    cart: clone(seedCarts),
    addresses: clone(seedAddresses),
    orders: clone(seedOrders),
    collectIds: [9, 25],
    footprints: seedFootprints(),
    coupons: clone(seedCoupons.myCoupons),
    checkin: seedCheckin(),
    points: clone(seedPoints.pointsRecords),
    messages: clone(seedMessages),
    reviewExtras: [],
    shopReviewExtras: [],
    joinedGroups: [clone(seedGroups.historyGroup)],
    openedGroups: [],
    user: clone(user),
    isGuest: false,
    exchangeRecords: [],
    // 售后工单
    aftersaleTickets: [],
    // 客服会话（含欢迎语）
    serviceMessages: [
      { me: false, text: '您好，这里是零食商城智能客服，常见问题可以点击下方快捷选项，也可以直接输入问题～', time: fmt(new Date()) }
    ],
    serviceRate: null,
    // 分享/邀请奖励记录
    shareRecords: [], // {key, type, id, time}
    inviteRewards: [], // 已奖励的拼团 id
    seckillRemind: [],
    counters: {
      cartId: 1005,
      orderId: 31000,
      orderSeq: 12,
      couponInst: 9100,
      pointId: 100,
      reviewId: 100,
      addressId: 10,
      groupId: 10,
      groupBizId: 500,
      ticketId: 4000,
      messageId: 200
    }
  }
}

let state = null

function init(force) {
  if (state && !force) return state
  let saved = null
  try {
    saved = wx.getStorageSync(STORAGE_KEY)
  } catch (e) {
    saved = null
  }
  if (!force && saved && saved.version === SCHEMA) {
    state = saved
  } else {
    state = buildSeed()
    save()
  }
  return state
}

function save() {
  try {
    wx.setStorageSync(STORAGE_KEY, state)
  } catch (e) {
    console.error('mock db 持久化失败', e)
  }
}

function reset() {
  state = buildSeed()
  save()
  return state
}

function nextId(key) {
  state.counters[key] = (state.counters[key] || 1) + 1
  return state.counters[key]
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  init: init,
  save: save,
  reset: reset,
  nextId: nextId,
  // 允许业务代码直接修改后调用 save
  get state() {
    if (!state) init()
    return state
  },
  fmtDay: fmtDay
}
