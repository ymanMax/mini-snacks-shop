// mock/index.js —— Mock 总入口：按 method + url 路由分发
const { delay } = require('./delay.js')
const db = require('./db.js')
const util = require('./util.js')
const { goodsList, G } = require('./data/goods.js')
const categories = require('./data/categories.js')
const promotions = require('./data/promotions.js')
const { groups: activeGroups } = require('./data/groups.js')
const shopReviewsSeed = require('./data/shopReviews.js')
const { levels, birthdayGifts } = require('./data/members.js')
const checkinRule = require('./data/checkin.js')
const { pointsRecords, exchangeGoods, rules: pointRules } = require('./data/points.js')
const { couponTemplates, expire } = require('./data/coupons.js')
const shop = require('./data/shop.js')
const { user: userSeed, guest } = require('./data/user.js')
const seedReviewsMod = require('./data/reviews.js')

const r2 = util.r2
const paginate = util.paginate
const fmt = util.fmt
const fmtDay = util.fmtDay

const goodsMap = {}
goodsList.forEach(function (g) { goodsMap[g.id] = g })
const catMap = {}
categories.forEach(function (c) { catMap[c.id] = c })

function allReviews() {
  return seedReviewsMod.reviews.concat(db.state.reviewExtras)
}
function allShopReviews() {
  return shopReviewsSeed.concat(db.state.shopReviewExtras)
}

// 商品补充动态字段（收藏态/分类名/评价数）
function decorate(g) {
  if (!g) return g
  const out = JSON.parse(JSON.stringify(g))
  out.categoryName = catMap[g.categoryId] ? catMap[g.categoryId].name : ''
  out.isCollect = db.state.collectIds.indexOf(g.id) > -1
  const rv = allReviews().filter(function (r) { return r.goodsId === g.id })
  out.reviewCount = rv.length
  out.avgScore = rv.length
    ? r2(rv.reduce(function (s, r) { return s + r.score }, 0) / rv.length)
    : 5
  return out
}

function save() { db.save() }
function addPoint(type, points, desc) {
  const rec = {
    id: db.nextId('pointId'),
    type: type,
    points: points,
    desc: desc,
    createTime: fmt(new Date())
  }
  db.state.points.unshift(rec)
  if (points > 0) {
    db.state.user.points += points
    if (type !== 2) db.state.user.growthValue += points
  } else {
    db.state.user.points += points
  }
  save()
  return rec
}
function addMessage(type, title, content, link) {
  const m = {
    id: db.nextId('messageId'),
    type: type,
    title: title,
    content: content,
    isRead: false,
    createTime: fmt(new Date()),
    relatedId: (link && link.id) || '',
    link: link || null
  }
  db.state.messages.unshift(m)
  save()
}

/* ---------------- 路由表 ---------------- */
const routes = []
function on(method, url, handler) { routes.push({ method: method, url: url, handler: handler }) }

/* ---------- 首页 / 主题 / 分类 ---------- */
on('GET', '/home/index', function () {
  return {
    banners: promotions.banners,
    themes: promotions.themes,
    categories: categories,
    seckill: promotions.seckill,
    fullReduceRules: promotions.fullReduceRules,
    shopNotice: shop.notice
  }
})

on('GET', '/category/list', function () {
  return categories
})

on('GET', '/theme/list', function () {
  return promotions.themes
})

on('GET', '/theme/detail', function (q) {
  const t = promotions.themes.find(function (x) { return x.id == q.id })
  if (!t) throw new Error('主题不存在')
  const goods = t.productIds.map(function (id) { return decorate(goodsMap[id]) }).filter(Boolean)
  return Object.assign({}, t, { goods: goods })
})

/* ---------- 商品 ---------- */
function filterGoods(q) {
  let list = goodsList.slice()
  if (q.categoryId) list = list.filter(function (g) { return g.categoryId == q.categoryId })
  if (q.themeId) {
    const t = promotions.themes.find(function (x) { return x.id == q.themeId })
    const ids = t ? t.productIds : []
    list = list.filter(function (g) { return ids.indexOf(g.id) > -1 })
  }
  if (q.keywords) {
    const kw = String(q.keywords).trim()
    list = list.filter(function (g) {
      return g.name.indexOf(kw) > -1 ||
        g.tags.join(',').indexOf(kw) > -1 ||
        (g.origin && g.origin.indexOf(kw) > -1)
    })
  }
  if (q.minPrice != null && q.minPrice !== '') {
    list = list.filter(function (g) { return g.price >= Number(q.minPrice) })
  }
  if (q.maxPrice != null && q.maxPrice !== '') {
    list = list.filter(function (g) { return g.price < Number(q.maxPrice) })
  }
  if (q.origins) {
    const arr = Array.isArray(q.origins) ? q.origins : String(q.origins).split(',')
    if (arr.length) list = list.filter(function (g) { return arr.indexOf(g.origin) > -1 })
  }
  if (q.onlyStock) list = list.filter(function (g) { return g.stock > 0 })
  const sort = q.sort || 'default'
  if (sort === 'priceAsc') list.sort(function (a, b) { return a.price - b.price })
  else if (sort === 'priceDesc') list.sort(function (a, b) { return b.price - a.price })
  else if (sort === 'sales') list.sort(function (a, b) { return b.sales - a.sales })
  else list.sort(function (a, b) { return b.hotScore - a.hotScore })
  return list.map(decorate)
}

on('GET', '/goods/list', function (q) {
  return paginate(filterGoods(q), q)
})

on('GET', '/goods/filterMeta', function (q) {
  const list = goodsList.filter(function (g) { return !q.categoryId || g.categoryId == q.categoryId })
  const originMap = {}
  let min = Infinity
  let max = 0
  list.forEach(function (g) {
    originMap[g.origin] = true
    if (g.price < min) min = g.price
    if (g.price > max) max = g.price
  })
  return {
    origins: Object.keys(originMap),
    minPrice: min === Infinity ? 0 : Math.floor(min),
    maxPrice: max === 0 ? 0 : Math.ceil(max)
  }
})

on('GET', '/goods/recent', function (q) {
  const list = goodsList.slice().sort(function (a, b) { return b.hotScore - a.hotScore }).map(decorate)
  return paginate(list, q)
})

on('GET', '/goods/hot', function (q) {
  const limit = Number(q.limit || 8)
  const list = goodsList.slice().sort(function (a, b) { return b.sales - a.sales })
    .filter(function (g) { return g.stock > 0 && g.id != q.excludeId })
    .slice(0, limit).map(decorate)
  return list
})

on('GET', '/goods/detail', function (q) {
  const g = goodsMap[q.id]
  if (!g) throw new Error('商品不存在或已下架')
  return decorate(g)
})

on('GET', '/goods/recommend', function (q) {
  const g = goodsMap[q.goodsId || q.id]
  const limit = Number(q.limit || 6)
  let list = goodsList.filter(function (x) {
    return g && x.categoryId === g.categoryId && x.id != g.id && x.stock > 0
  })
  if (list.length < limit) {
    list = list.concat(goodsList.filter(function (x) {
      return x.stock > 0 && (!g || x.id != g.id) && list.indexOf(x) < 0
    }))
  }
  return list.slice(0, limit).map(decorate)
})

/* ---------- 评价 ---------- */
function reviewSummary(goodsId) {
  const list = allReviews().filter(function (r) { return r.goodsId == goodsId })
  const count = list.length
  const avg = count ? r2(list.reduce(function (s, r) { return s + r.score }, 0) / count) : 5
  const goodCount = list.filter(function (r) { return r.score >= 4 }).length
  const tagMap = {}
  list.forEach(function (r) {
    r.tags.forEach(function (t) { tagMap[t] = (tagMap[t] || 0) + 1 })
  })
  const tags = Object.keys(tagMap).map(function (t) { return { tag: t, count: tagMap[t] } })
    .sort(function (a, b) { return b.count - a.count }).slice(0, 6)
  const preview = list.slice().sort(function (a, b) {
    return (b.images.length - a.images.length) || b.score - a.score
  }).slice(0, 3)
  return {
    avgScore: avg,
    count: count,
    goodRate: count ? Math.round(goodCount / count * 100) : 100,
    tags: tags,
    preview: preview
  }
}

on('GET', '/review/summary', function (q) {
  return reviewSummary(q.goodsId)
})

on('GET', '/review/goods', function (q) {
  const list = allReviews().filter(function (r) { return r.goodsId == q.goodsId })
    .sort(function (a, b) { return (a.id < b.id ? 1 : -1) })
  return paginate(list, q)
})

on('GET', '/review/shop', function (q) {
  const list = allShopReviews().slice().sort(function (a, b) { return (a.id < b.id ? 1 : -1) })
  return Object.assign(paginate(list, q), {
    avg: shop.subScores,
    score: shop.score
  })
})

on('POST', '/review/submit', function (body) {
  const order = db.state.orders.find(function (o) { return o.id == body.orderId })
  if (!order) throw new Error('订单不存在')
  if (order.isReviewed) throw new Error('该订单已评价')
  let rid = db.nextId('reviewId')
  const goodsReviews = body.goods || []
  goodsReviews.forEach(function (gr, i) {
    db.state.reviewExtras.unshift({
      id: rid + i,
      orderId: order.id,
      goodsId: gr.goodsId,
      userId: db.state.user.id,
      userName: '零***好',
      avatar: db.state.user.avatar,
      score: Number(gr.score) || 5,
      tags: gr.tags || [],
      content: gr.content || '好评！',
      images: gr.images || [],
      createTime: fmt(new Date()),
      reply: '',
      mine: true
    })
  })
  if (body.shop) {
    db.state.shopReviewExtras.unshift({
      id: db.nextId('reviewId'),
      orderId: order.id,
      userName: '零***好',
      avatar: db.state.user.avatar,
      scores: body.shop.scores || { fresh: 5, speed: 5, package: 5 },
      content: body.shop.content || '',
      createTime: fmt(new Date()),
      reply: '',
      mine: true
    })
  }
  order.isReviewed = true
  // 评价奖励 +20 积分
  addPoint(3, 20, '订单 ' + order.orderNo + ' 评价奖励')
  save()
  return { success: true, points: 20 }
})

/* ---------- 购物车 ---------- */
function syncCart() {
  db.state.cart.forEach(function (item) {
    const g = goodsMap[item.goodsId]
    item.invalid = !g || g.stock === 0
    if (g) item.stock = g.stock
  })
  save()
}
function cartView() {
  syncCart()
  const valid = db.state.cart.filter(function (i) { return !i.invalid })
  const invalid = db.state.cart.filter(function (i) { return i.invalid })
  let count = 0
  let checkedCount = 0
  let checkedAmount = 0
  valid.forEach(function (i) {
    count += i.count
    if (i.checked) {
      checkedCount += i.count
      checkedAmount = r2(checkedAmount + i.price * i.count)
    }
  })
  const allChecked = valid.length > 0 && valid.every(function (i) { return i.checked })
  return {
    valid: valid,
    invalid: invalid,
    totalCount: count,
    checkedCount: checkedCount,
    checkedAmount: checkedAmount,
    allChecked: allChecked
  }
}

on('GET', '/cart/list', function () {
  return cartView()
})

on('POST', '/cart/add', function (body) {
  const g = goodsMap[body.goodsId]
  if (!g) throw new Error('商品不存在')
  if (g.stock === 0) throw new Error('该商品暂时缺货')
  const specText = body.specText || (g.specs[0].values[0].label + ' · ' + g.specs[1].values[0].label)
  const price = body.specPrice != null ? Number(body.specPrice) : g.price
  const count = Number(body.count) || 1
  const exist = db.state.cart.find(function (i) {
    return !i.invalid && i.goodsId == body.goodsId && i.specText === specText
  })
  if (exist) {
    exist.count = Math.min(exist.stock, exist.count + count)
  } else {
    db.state.cart.push({
      id: db.nextId('cartId'),
      cartId: db.state.counters.cartId,
      goodsId: g.id,
      name: g.name,
      pic: body.pic || g.pic,
      specText: specText,
      price: price,
      count: Math.min(g.stock, count),
      checked: true,
      stock: g.stock,
      invalid: false
    })
  }
  save()
  return cartView()
})

on('POST', '/cart/update', function (body) {
  const item = db.state.cart.find(function (i) { return i.id == body.id })
  if (!item) throw new Error('购物车项不存在')
  if (body.count != null) item.count = Math.max(1, Math.min(item.stock || 99, Number(body.count)))
  if (body.checked != null) item.checked = !!body.checked
  save()
  return cartView()
})

on('POST', '/cart/toggleAll', function (body) {
  db.state.cart.forEach(function (i) { if (!i.invalid) i.checked = !!body.checked })
  save()
  return cartView()
})

on('POST', '/cart/delete', function (body) {
  const ids = (body.ids || []).map(Number)
  db.state.cart = db.state.cart.filter(function (i) { return ids.indexOf(i.id) < 0 })
  save()
  return cartView()
})

on('POST', '/cart/clearInvalid', function () {
  db.state.cart = db.state.cart.filter(function (i) { return !i.invalid })
  save()
  return cartView()
})

/* ---------- 地址 ---------- */
on('GET', '/address/list', function (q) {
  let list = db.state.addresses.slice().sort(function (a, b) {
    return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
  })
  list = list.map(function (a) {
    return Object.assign({}, a, { outRange: a.distanceKm > shop.deliveryRule.rangeKm })
  })
  if (q.tag) list = list.filter(function (a) { return a.tag === q.tag })
  return list
})

// 地图选点 mock POI
on('GET', '/address/pois', function (q) {
  // eslint-disable-next-line
  let list = require('./data/pois.js').slice()
  if (q.keyword) {
    const kw = String(q.keyword)
    list = list.filter(function (p) { return p.name.indexOf(kw) > -1 || p.address.indexOf(kw) > -1 })
  }
  list.sort(function (a, b) { return a.distanceKm - b.distanceKm })
  return list
})

// 模拟定位
on('GET', '/address/locate', function () {
  return require('./data/pois.js')[0]
})

on('POST', '/address/save', function (body) {
  if (!body.name || !body.phone || !body.detail) throw new Error('请填写完整的收货信息')
  if (body.id) {
    const a = db.state.addresses.find(function (x) { return x.id == body.id })
    if (a) Object.assign(a, body)
  } else {
    const isFirst = db.state.addresses.length === 0
    db.state.addresses.push(Object.assign({
      id: db.nextId('addressId'),
      tag: '',
      isDefault: isFirst,
      distanceKm: 2
    }, body, { id: db.state.counters.addressId }))
  }
  if (body.isDefault) {
    db.state.addresses.forEach(function (x) { x.isDefault = x.id == (body.id || db.state.counters.addressId) })
  }
  save()
  return db.state.addresses
})

on('POST', '/address/delete', function (body) {
  db.state.addresses = db.state.addresses.filter(function (x) { return x.id != body.id })
  save()
  return db.state.addresses
})

on('POST', '/address/setDefault', function (body) {
  db.state.addresses.forEach(function (x) { x.isDefault = x.id == body.id })
  save()
  return db.state.addresses
})

/* ---------- 订单计价 ---------- */
function memberLevel() {
  return levels.find(function (l) { return l.level === db.state.user.level }) || levels[0]
}
function calcFreight(goodsAmount, distanceKm) {
  const rule = shop.deliveryRule
  const ml = memberLevel()
  const freeThreshold = ml.freeThreshold || rule.freeThreshold
  if (goodsAmount >= freeThreshold) return 0
  let fee = rule.baseFee
  if (distanceKm > rule.baseKm) {
    fee = r2(rule.baseFee + Math.ceil(distanceKm - rule.baseKm) * rule.perKmFee)
  }
  return fee
}
function findCoupon(instanceId) {
  return db.state.coupons.find(function (c) { return c.instanceId == instanceId && c.status === 1 })
}
function couponDiscount(coupon, goodsTotal, items) {
  if (!coupon) return 0
  if (goodsTotal < coupon.threshold) return 0
  if (coupon.scope === 'category') {
    const catIds = coupon.categoryIds || []
    const inScope = items.some(function (it) {
      const g = goodsMap[it.goodsId]
      return g && catIds.indexOf(g.categoryId) > -1
    })
    if (!inScope) return 0
  }
  if (coupon.type === 2) return r2(goodsTotal * (100 - coupon.discount) / 100)
  return coupon.discount
}
function priceOrder(items, addressId, couponInstanceId) {
  const goodsTotal = r2(items.reduce(function (s, it) { return s + it.price * it.count }, 0))
  let fullReduce = 0
  promotions.fullReduceRules.forEach(function (rule) {
    if (goodsTotal >= rule.threshold) fullReduce = rule.reduce
  })
  const addr = db.state.addresses.find(function (a) { return a.id == addressId }) ||
    db.state.addresses.find(function (a) { return a.isDefault }) || db.state.addresses[0]
  const coupon = findCoupon(couponInstanceId)
  const cDiscount = couponDiscount(coupon, goodsTotal - fullReduce, items)
  const discountAmount = r2(fullReduce + cDiscount)
  const distance = addr ? addr.distanceKm : 2
  const outRange = addr ? distance > shop.deliveryRule.rangeKm : false
  const freight = outRange ? 0 : calcFreight(goodsTotal - discountAmount, distance)
  const payAmount = r2(goodsTotal - discountAmount + (outRange ? 0 : freight))
  // 可用券列表（按优惠金额从大到小）
  const usableCoupons = db.state.coupons.filter(function (c) { return c.status === 1 })
    .map(function (c) {
      const d = couponDiscount(c, goodsTotal - fullReduce, items)
      return Object.assign({}, c, { usable: d > 0, amount: d })
    })
    .filter(function (c) { return c.usable })
    .sort(function (a, b) { return b.amount - a.amount })
  // 系统自动推荐的最优券
  const bestCoupon = usableCoupons[0]
    ? { instanceId: usableCoupons[0].instanceId, name: usableCoupons[0].name, amount: usableCoupons[0].amount }
    : null
  // 满减阶梯凑单提示
  const rules = promotions.fullReduceRules
  const nextLadder = rules.find(function (rule) { return goodsTotal < rule.threshold })
  const freeThreshold = memberLevel().freeThreshold || shop.deliveryRule.freeThreshold
  const amountAfterFull = goodsTotal - fullReduce
  return {
    goodsTotal: goodsTotal,
    fullReduce: fullReduce,
    couponDiscount: cDiscount,
    coupon: coupon && cDiscount > 0 ? coupon : null,
    bestCoupon: bestCoupon,
    discountAmount: discountAmount,
    freight: freight,
    outRange: outRange,
    rangeKm: shop.deliveryRule.rangeKm,
    payAmount: payAmount,
    address: addr,
    usableCoupons: usableCoupons,
    freeThreshold: freeThreshold,
    ladders: {
      rules: rules,
      current: fullReduce,
      next: nextLadder
        ? { threshold: nextLadder.threshold, reduce: nextLadder.reduce, gap: r2(nextLadder.threshold - goodsTotal) }
        : null
    },
    freeShipGap: amountAfterFull < freeThreshold ? r2(freeThreshold - amountAfterFull) : 0
  }
}

on('POST', '/order/preview', function (body) {
  const items = body.items || []
  return priceOrder(items, body.addressId, body.couponInstanceId)
})

/* ---------- 订单 ---------- */
on('GET', '/order/list', function (q) {
  let list = db.state.orders.slice().sort(function (a, b) { return (a._ts < b._ts ? 1 : -1) })
  if (q.status && Number(q.status) > 0) list = list.filter(function (o) { return o.status == q.status })
  return paginate(list, q)
})

on('GET', '/order/counts', function () {
  const c = { pay: 0, send: 0, delivery: 0, receive: 0, review: 0 }
  db.state.orders.forEach(function (o) {
    if (o.status === 1) c.pay++
    else if (o.status === 2) c.send++
    else if (o.status === 3) c.delivery++
    else if (o.status === 4) c.receive++
    else if (o.status === 5 && !o.isReviewed) c.review++
  })
  return c
})

on('GET', '/order/detail', function (q) {
  const o = db.state.orders.find(function (x) { return x.id == q.id || x.orderNo == q.id })
  if (!o) throw new Error('订单不存在')
  return o
})

on('POST', '/order/create', function (body) {
  const items = body.items || []
  if (!items.length) throw new Error('请先选择商品')
  const pricing = priceOrder(items, body.addressId, body.couponInstanceId)
  if (!pricing.address) throw new Error('请先添加收货地址')
  if (pricing.outRange) {
    throw new Error('该地址距店铺 ' + pricing.address.distanceKm + 'km，超出 ' + pricing.rangeKm + 'km 配送范围，暂不支持配送')
  }
  const seq = db.nextId('orderSeq')
  const id = db.nextId('orderId')
  const now = new Date()
  const order = {
    id: id,
    orderNo: util.orderNo(seq),
    status: 1,
    items: items.map(function (it) {
      return {
        goodsId: it.goodsId,
        name: it.name,
        pic: it.pic,
        specText: it.specText,
        price: it.price,
        count: it.count
      }
    }),
    goodsTotal: pricing.goodsTotal,
    totalAmount: pricing.goodsTotal,
    fullReduce: pricing.fullReduce,
    discountAmount: pricing.discountAmount,
    couponId: pricing.coupon ? pricing.coupon.instanceId : 0,
    couponTitle: pricing.coupon ? pricing.coupon.name : '',
    freight: pricing.freight,
    payAmount: pricing.payAmount,
    payType: Number(body.payType) || 1,
    remark: body.remark || '',
    deliveryDate: fmtDay(now),
    deliverySlot: body.slot || shop.deliverySlots[0],
    addressSnapshot: {
      name: pricing.address.name,
      phone: pricing.address.phone,
      fullAddress: pricing.address.province + pricing.address.city + pricing.address.district + pricing.address.detail,
      tag: pricing.address.tag,
      distanceKm: pricing.address.distanceKm
    },
    rider: null,
    timeline: [
      { time: fmt(now), status: '订单已提交', remark: '订单已提交，等待买家付款' }
    ],
    isReviewed: false,
    createTime: fmt(now),
    _ts: now.getTime()
  }
  db.state.orders.unshift(order)
  // 从购物车移除已下单商品
  if (body.from === 'cart') {
    const cartIds = items.map(function (it) { return Number(it.cartId) }).filter(Boolean)
    db.state.cart = db.state.cart.filter(function (c) { return cartIds.indexOf(c.id) < 0 })
  }
  // 货到付款直接进入待发货
  if (order.payType === 2) {
    order.status = 2
    order.timeline.push({ time: fmt(new Date()), status: '支付完成', remark: '货到付款，送达后付款（演示环境，不产生真实交易）' })
    addMessage(2, '下单成功', '订单 ' + order.orderNo + ' 已受理（货到付款），商家正在备货。', { type: 'order', id: order.id })
  }
  save()
  return order
})

on('POST', '/order/pay', async function (body) {
  await delay(2000, 2000) // mock 支付 2 秒 loading
  const o = db.state.orders.find(function (x) { return x.id == body.id })
  if (!o) throw new Error('订单不存在')
  if (o.status !== 1) throw new Error('订单状态异常')
  o.status = 2
  o.timeline.push({ time: fmt(new Date()), status: '支付完成', remark: '微信支付成功（演示环境，不产生真实交易）' })
  // 占用优惠券
  if (o.couponId) {
    const c = db.state.coupons.find(function (x) { return x.instanceId == o.couponId })
    if (c) { c.status = 2; c.usedOrderNo = o.orderNo }
  }
  save()
  addMessage(2, '支付成功', '订单 ' + o.orderNo + ' 已支付成功，商家正在备货，请耐心等待～', { type: 'order', id: o.id })
  save()
  return { success: true, order: o }
})

on('POST', '/order/cancel', function (body) {
  const o = db.state.orders.find(function (x) { return x.id == body.id })
  if (!o) throw new Error('订单不存在')
  if (o.status !== 1) throw new Error('当前状态不可取消')
  o.status = 6
  o.timeline.push({ time: fmt(new Date()), status: '订单已取消', remark: '买家主动取消订单' })
  if (o.couponId) {
    const c = db.state.coupons.find(function (x) { return x.instanceId == o.couponId })
    if (c) c.status = 1
  }
  addMessage(2, '订单已取消', '订单 ' + o.orderNo + ' 已取消，欢迎再次选购。', { type: 'order', id: o.id })
  save()
  return o
})

on('POST', '/order/advance', function (body) {
  const o = db.state.orders.find(function (x) { return x.id == body.id })
  if (!o) throw new Error('订单不存在')
  const now = fmt(new Date())
  if (o.status === 2) {
    o.status = 3
    o.rider = { name: '王师傅', phone: '138****1024' }
    o.timeline.push({ time: now, status: '商家分拣', remark: '商家正在拣货打包，请耐心等待' })
    o.timeline.push({ time: now, status: '骑手取货', remark: '骑手王师傅已取货，正在飞奔配送中' })
    addMessage(2, '订单已发货', '您的订单 ' + o.orderNo + ' 骑手已取货，正在飞奔配送中。', { type: 'order', id: o.id })
  } else if (o.status === 3) {
    o.status = 4
    o.timeline.push({ time: now, status: '配送中', remark: '骑手已到达您附近，请保持电话畅通' })
    addMessage(2, '订单配送中', '您的订单 ' + o.orderNo + ' 已到达您附近，请留意骑手来电。', { type: 'order', id: o.id })
  } else {
    throw new Error('当前状态无需推进')
  }
  save()
  return o
})

on('POST', '/order/confirm', function (body) {
  const o = db.state.orders.find(function (x) { return x.id == body.id })
  if (!o) throw new Error('订单不存在')
  if (o.status !== 4) throw new Error('当前状态不可确认收货')
  o.status = 5
  o.timeline.push({ time: fmt(new Date()), status: '已送达', remark: '订单已送达，祝您用餐愉快' })
  const points = Math.floor(o.payAmount)
  if (points > 0) addPoint(1, points, '订单 ' + o.orderNo + ' 完成，购物返积分')
  addMessage(2, '订单已送达', '订单 ' + o.orderNo + ' 已送达，祝您用餐愉快！', { type: 'order', id: o.id })
  addMessage(4, '评价有奖励', '订单 ' + o.orderNo + ' 已完成，晒图评价可获 20 积分奖励～', { type: 'order', id: o.id })
  save()
  return o
})

on('POST', '/order/reorder', function (body) {
  const o = db.state.orders.find(function (x) { return x.id == body.id })
  if (!o) throw new Error('订单不存在')
  let added = 0
  o.items.forEach(function (it) {
    const g = goodsMap[it.goodsId]
    if (!g || g.stock === 0) return
    const exist = db.state.cart.find(function (c) {
      return c.goodsId === it.goodsId && c.specText === it.specText
    })
    if (exist) { exist.count += it.count } else {
      db.state.cart.push({
        id: db.nextId('cartId'),
        cartId: db.state.counters.cartId,
        goodsId: g.id,
        name: g.name,
        pic: it.pic || g.pic,
        specText: it.specText,
        price: it.price,
        count: it.count,
        checked: true,
        stock: g.stock,
        invalid: false
      })
    }
    added++
  })
  save()
  return { success: true, added: added, cart: cartView() }
})

/* ---------- 售后 ---------- */
const AFTER_TYPE = { 1: '仅退款', 2: '退货退款', 3: '换货' }
const AFTER_STATUS = { 1: '待处理', 2: '处理中', 3: '已完成', 4: '已取消' }

function ticketView(t) {
  return Object.assign({}, t, {
    typeText: AFTER_TYPE[t.type],
    statusText: AFTER_STATUS[t.status],
    goods: t.goodsSnapshot
  })
}

on('POST', '/aftersale/apply', function (body) {
  const o = db.state.orders.find(function (x) { return x.id == body.orderId })
  if (!o) throw new Error('订单不存在')
  if (o.status === 1 || o.status === 6) throw new Error('该订单状态暂不支持售后')
  const exists = db.state.aftersaleTickets.find(function (t) {
    return t.orderId == o.id && t.status !== 4
  })
  if (exists) throw new Error('该订单已有进行中的售后申请')
  const type = Number(body.type)
  if (!AFTER_TYPE[type]) throw new Error('请选择售后类型')
  if (!body.reason) throw new Error('请选择申请原因')
  const amount = type === 3 ? 0 : o.payAmount
  const now = fmt(new Date())
  const ticket = {
    id: db.nextId('ticketId'),
    orderId: o.id,
    orderNo: o.orderNo,
    type: type,
    reason: body.reason,
    desc: body.desc || '',
    amount: amount,
    status: 1,
    goodsSnapshot: o.items.slice(0, 3),
    hiddenGoods: o.items.length - 3,
    createTime: now,
    timeline: [
      { title: '售后申请已提交', remark: AFTER_TYPE[type] + '申请：' + body.reason, time: now, state: 'current' }
    ],
    rate: null
  }
  db.state.aftersaleTickets.unshift(ticket)
  o.timeline.push({ time: now, status: '售后申请', remark: '买家提交' + AFTER_TYPE[type] + '申请：' + body.reason })
  addMessage(2, '售后申请已提交', '订单 ' + o.orderNo + ' 的' + AFTER_TYPE[type] + '申请已提交，客服将尽快为您处理。', { type: 'aftersale', id: ticket.id })
  save()
  return ticketView(ticket)
})

on('GET', '/aftersale/list', function (q) {
  let list = db.state.aftersaleTickets.slice().sort(function (a, b) { return (a.id < b.id ? 1 : -1) })
  if (q.status) {
    const s = Number(q.status)
    if (s === 99) list = list.filter(function (t) { return t.status === 1 || t.status === 2 })
    else list = list.filter(function (t) { return t.status === s })
  }
  return paginate(list.map(ticketView), q)
})

on('GET', '/aftersale/detail', function (q) {
  const t = db.state.aftersaleTickets.find(function (x) { return x.id == q.id })
  if (!t) throw new Error('售后单不存在')
  return ticketView(t)
})

on('POST', '/aftersale/cancel', function (body) {
  const t = db.state.aftersaleTickets.find(function (x) { return x.id == body.id })
  if (!t) throw new Error('售后单不存在')
  if (t.status !== 1) throw new Error('当前状态不可取消')
  t.status = 4
  t.timeline.push({ title: '售后已取消', remark: '买家主动撤销申请', time: fmt(new Date()), state: 'cancel' })
  const o = db.state.orders.find(function (x) { return x.id == t.orderId })
  if (o) o.timeline.push({ time: fmt(new Date()), status: '售后取消', remark: '买家撤销了' + t.typeText + '申请' })
  save()
  return ticketView(t)
})

// 演示：模拟商家处理（待处理→处理中→已完成）
on('POST', '/aftersale/advance', function (body) {
  const t = db.state.aftersaleTickets.find(function (x) { return x.id == body.id })
  if (!t) throw new Error('售后单不存在')
  const o = db.state.orders.find(function (x) { return x.id == t.orderId })
  const now = fmt(new Date())
  if (t.status === 1) {
    t.status = 2
    const remark = t.type === 1
      ? '商家已同意退款，财务正在处理，预计 1-3 个工作日原路退回'
      : t.type === 2
        ? '商家已同意退货退款，请按地址寄回商品'
        : '商家已同意换货，新品正在为您发出'
    t.timeline.push({ title: '商家已受理', remark: remark, time: now, state: 'current' })
    if (o) o.timeline.push({ time: now, status: '售后处理中', remark: AFTER_TYPE[t.type] + '申请商家已受理' })
    addMessage(2, '售后已受理', '订单 ' + t.orderNo + ' 的' + AFTER_TYPE[t.type] + '申请商家已受理。', { type: 'aftersale', id: t.id })
  } else if (t.status === 2) {
    t.status = 3
    const remark = t.type === 3 ? '换货商品已发出，请注意查收' : '退款 ¥' + t.amount.toFixed(2) + ' 已原路退回（演示，不产生真实交易）'
    t.timeline.push({ title: t.type === 3 ? '换货已发出' : '退款已完成', remark: remark, time: now, state: 'done' })
    if (o) o.timeline.push({ time: now, status: '售后完成', remark: remark })
    addMessage(2, '售后已完成', '订单 ' + t.orderNo + ' 的' + AFTER_TYPE[t.type] + '已处理完成。', { type: 'aftersale', id: t.id })
  } else {
    throw new Error('当前状态无需处理')
  }
  save()
  return ticketView(t)
})

on('POST', '/aftersale/rate', function (body) {
  const t = db.state.aftersaleTickets.find(function (x) { return x.id == body.id })
  if (!t) throw new Error('售后单不存在')
  t.rate = {
    speed: Number(body.speed) || 5,
    solved: Number(body.solved) || 5,
    content: body.content || '',
    time: fmt(new Date())
  }
  save()
  return ticketView(t)
})

/* ---------- 客服 ---------- */
const SERVICE_RULES = [
  { re: /物流|快递|到哪|配送时间|发货/, text: '现货商品付款后 24 小时内发货，配送范围为门店周边 15km，您可以在订单详情页实时查看骑手配送进度～' },
  { re: /退|售后|换货|退款|坏了/, text: '在售订单可在「订单详情 → 申请售后」选择仅退款/退货退款/换货，提交后商家会在 1-2 小时内受理，退款原路退回。' },
  { re: /券|优惠|满减|打折/, text: '领券中心每天都有满减券可领，下单时系统会自动为您匹配最优优惠券，并与满减、会员价叠加使用哦～' },
  { re: /地址|改地址|配送范围/, text: '收货地址可在「我的 → 收货地址」中地图选点管理；门店周边 15km 内均可配送，下单时会按距离实时试算运费。' },
  { re: /拼团|成团|开团/, text: '2-3 人即可成团，拼团价约 8.2 折；24 小时未成团系统会自动退款，邀请好友参团还能获得优惠券奖励～' },
  { re: /积分|签到|成长值|会员/, text: '每日签到、购物、晒图评价都可获得积分，积分能兑换优惠券与零食；成长值越高会员折扣越大哦～' },
  { re: /人工|客服电话|真人/, text: '人工客服服务时间为每日 09:00-22:00，您也可以拨打门店电话 0571-88886666，我们会第一时间为您处理。' }
]
const SERVICE_FALLBACK = '已收到您的问题，智能客服会持续学习～您也可以点击「人工客服」，工作时间 09:00-22:00 为您服务。'

on('GET', '/service/history', function () {
  return {
    messages: db.state.serviceMessages,
    rate: db.state.serviceRate,
    quickQuestions: ['配送时效与范围', '如何申请退款/售后', '优惠券怎么使用', '拼团未成团怎么办', '联系人工客服']
  }
})

on('POST', '/service/send', function (body) {
  const text = String(body.text || '').trim()
  if (!text) throw new Error('内容不能为空')
  db.state.serviceMessages.push({ me: true, text: text, time: fmt(new Date()) })
  const hit = SERVICE_RULES.find(function (r) { return r.re.test(text) })
  db.state.serviceMessages.push({ me: false, text: hit ? hit.text : SERVICE_FALLBACK, time: fmt(new Date()) })
  if (db.state.serviceMessages.length > 100) {
    db.state.serviceMessages = db.state.serviceMessages.slice(-100)
  }
  save()
  return { messages: db.state.serviceMessages }
})

on('POST', '/service/rate', function (body) {
  db.state.serviceRate = {
    speed: Number(body.speed) || 5,
    solved: Number(body.solved) || 5,
    content: body.content || '',
    time: fmt(new Date())
  }
  save()
  return { success: true, rate: db.state.serviceRate }
})

/* ---------- 会员 ---------- */
on('GET', '/member/info', function () {
  const u = db.state.isGuest ? guest : db.state.user
  const cur = levels.find(function (l) { return l.level === u.level }) || levels[0]
  const next = levels.find(function (l) { return l.level === u.level + 1 })
  return {
    user: u,
    isGuest: db.state.isGuest,
    levelInfo: cur,
    nextLevel: next,
    needGrowth: next ? next.minGrowth - u.growthValue : 0,
    growthPct: next ? Math.min(100, Math.round((u.growthValue - cur.minGrowth) / (next.minGrowth - cur.minGrowth) * 100)) : 100,
    couponCount: db.state.coupons.filter(function (c) { return c.status === 1 }).length,
    isBirthdayMonth: u.birthday ? new Date().getMonth() + 1 === Number(u.birthday.split('-')[1]) : false,
    birthdayClaimed: !!db.state.birthdayClaimed
  }
})

on('GET', '/member/levels', function () {
  return { levels: levels, currentLevel: db.state.user.level }
})

on('POST', '/member/birthday/gift', function () {
  if (db.state.birthdayClaimed) throw new Error('生日礼包已领取')
  const now = new Date()
  const bm = db.state.user.birthday ? Number(db.state.user.birthday.split('-')[1]) : 0
  if (bm !== now.getMonth() + 1) throw new Error('仅生日当月可领取生日礼包')
  const gift = birthdayGifts.find(function (g) { return g.level === db.state.user.level }) || birthdayGifts[0]
  const tpl = couponTemplates.find(function (t) { return t.id === gift.couponId })
  db.state.coupons.unshift({
    instanceId: db.nextId('couponInst'),
    templateId: tpl.id,
    name: tpl.name,
    type: tpl.type,
    threshold: tpl.threshold,
    discount: tpl.discount,
    scope: tpl.scope,
    scopeLabel: tpl.scopeLabel,
    categoryIds: tpl.categoryIds,
    status: 1,
    source: '生日赠送',
    expireTime: expire(30)
  })
  addPoint(5, gift.points, '生日礼包赠送')
  db.state.birthdayClaimed = true
  save()
  return { success: true, gift: gift }
})

/* ---------- 签到 ---------- */
function checkinState() {
  const now = new Date()
  const ym = now.getFullYear() + '-' + (now.getMonth() + 1)
  if (db.state.checkin.yearMonth !== ym) {
    db.state.checkin = { yearMonth: ym, records: [], continuousDays: 0, todaySigned: false, lastSignDay: 0 }
    save()
  }
  const st = db.state.checkin
  st.todaySigned = st.records.indexOf(now.getDate()) > -1
  return st
}

on('GET', '/checkin/info', function () {
  const st = checkinState()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeek = new Date(year + '/' + month + '/01').getDay()
  const idx = st.todaySigned ? st.continuousDays % 7 : (st.continuousDays % 7)
  return {
    rule: checkinRule,
    state: st,
    year: year,
    month: month,
    daysInMonth: daysInMonth,
    firstWeek: firstWeek,
    today: now.getDate(),
    nextReward: checkinRule.rewards[idx]
  }
})

on('POST', '/checkin/do', function () {
  const st = checkinState()
  const now = new Date()
  const day = now.getDate()
  if (st.records.indexOf(day) > -1) throw new Error('今日已签到')
  // 连签判断：上次签到日期为昨天；跨月签到同样延续
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).getDate()
  if (st.lastSignDay === yesterday || st.continuousDays === 0) {
    st.continuousDays += 1
  } else {
    st.continuousDays = 1
  }
  st.records.push(day)
  st.lastSignDay = day
  st.todaySigned = true
  const reward = checkinRule.rewards[(st.continuousDays - 1) % 7]
  addPoint(2, reward.points, '每日签到奖励（连签第 ' + st.continuousDays + ' 天）')
  db.state.user.growthValue += reward.points
  save()
  return { success: true, points: reward.points, continuousDays: st.continuousDays, reward: reward }
})

/* ---------- 积分 ---------- */
on('GET', '/points/list', function (q) {
  let list = db.state.points.slice()
  if (q.type) {
    if (Number(q.type) === 1) list = list.filter(function (r) { return r.points > 0 })
    if (Number(q.type) === 2) list = list.filter(function (r) { return r.points < 0 })
  }
  return {
    balance: db.state.user.points,
    rules: pointRules,
    page: paginate(list, q)
  }
})

on('GET', '/points/exchange/list', function () {
  return exchangeGoods
})

on('POST', '/points/exchange', function (body) {
  const item = exchangeGoods.find(function (x) { return x.id == body.id })
  if (!item) throw new Error('兑换商品不存在')
  if (item.stock <= 0) throw new Error('已被抢光啦')
  if (db.state.user.points < item.points) throw new Error('积分不足')
  item.stock -= 1
  item.redeemed += 1
  if (item.type === 'coupon') {
    // 兑换项 id 1 -> 5 元无门槛券(模板4)；id 4 -> 满59减8券(模板1)
    const templateId = item.id === 4 ? 1 : 4
    const t = couponTemplates.find(function (x) { return x.id === templateId })
    db.state.coupons.unshift({
      instanceId: db.nextId('couponInst'),
      templateId: t.id,
      name: t.name,
      type: t.type,
      threshold: t.threshold,
      discount: t.discount,
      scope: t.scope,
      scopeLabel: t.scopeLabel,
      status: 1,
      source: '积分兑换',
      expireTime: expire(15)
    })
  }
  addPoint(4, -item.points, '积分兑换：' + item.name)
  db.state.exchangeRecords.push({ id: item.id, name: item.name, time: fmt(new Date()) })
  save()
  return { success: true, balance: db.state.user.points }
})

/* ---------- 优惠券 ---------- */
on('GET', '/coupon/templates', function () {
  const mine = db.state.coupons
  return couponTemplates.map(function (t) {
    return Object.assign({}, t, {
      pic: shop.logo,
      received: mine.some(function (c) { return c.templateId === t.id && c.status !== 3 })
    })
  })
})

on('GET', '/coupon/mine', function (q) {
  let list = db.state.coupons.slice().sort(function (a, b) { return a.status - b.status })
  if (q.status) list = list.filter(function (c) { return c.status == q.status })
  return list
})

on('POST', '/coupon/receive', function (body) {
  const t = couponTemplates.find(function (x) { return x.id == body.templateId })
  if (!t) throw new Error('优惠券不存在')
  const exists = db.state.coupons.some(function (c) {
    return c.templateId === t.id && c.status === 1 && c.source !== '生日赠送' && c.source !== '积分兑换'
  })
  if (exists) throw new Error('您已领取过该券')
  db.state.coupons.unshift({
    instanceId: db.nextId('couponInst'),
    templateId: t.id,
    name: t.name,
    type: t.type,
    threshold: t.threshold,
    discount: t.discount,
    scope: t.scope,
    scopeLabel: t.scopeLabel,
    categoryIds: t.categoryIds,
    status: 1,
    source: '活动领取',
    expireTime: expire(t.expireDays)
  })
  addMessage(3, '优惠券领取成功', '您领取的「' + t.name + '」已放入卡包，下单时可自动抵扣，快去使用吧～', { type: 'coupon', id: '' })
  save()
  return { success: true }
})

/* ---------- 促销 / 秒杀 ---------- */
on('GET', '/promotion/seckill', function () {
  return promotions.seckill
})
on('GET', '/promotion/rules', function () {
  return { fullReduceRules: promotions.fullReduceRules, freeThreshold: memberLevel().freeThreshold || shop.deliveryRule.freeThreshold }
})

// 秒杀场次：每日 10/14/20 点三场，每次 2 小时
on('GET', '/promotion/sessions', function () {
  const now = new Date()
  const today = function (h, m) { const d = new Date(); d.setHours(h, m || 0, 0, 0); return d.getTime() }
  const SESSION_HOURS = [10, 14, 20]
  // 场次商品（每场 8 款，错峰轮换）
  const sessionGoods = function (seed) {
    const arr = []
    for (let i = 0; i < 8; i++) {
      const id = ((seed * 3 + i * 7 + i * i) % 32) + 1
      if (arr.some(function (a) { return a.goodsId === id })) continue
      const g = goodsMap[id]
      if (!g || g.stock === 0) continue
      const soldPercent = (seed * 13 + i * 17 + id * 3) % 92 + 6
      arr.push({
        goodsId: g.id,
        name: g.name,
        pic: g.pic,
        price: g.price,
        seckillPrice: r2(g.price * (0.62 + ((id + seed) % 4) * 0.07)),
        stock: 80 + seed * 20,
        soldPercent: soldPercent,
        limit: (i % 3) + 1
      })
    }
    return arr
  }
  const sessions = SESSION_HOURS.map(function (h, i) {
    const start = today(h)
    const end = today(h + 2)
    let status
    if (now.getTime() < start) status = 0
    else if (now.getTime() > end) status = 2
    else status = 1
    return {
      id: i + 1,
      label: h + ':00 场',
      status: status,
      startTime: start,
      endTime: end,
      goods: sessionGoods(i + 1)
    }
  })
  const active = sessions.find(function (s) { return s.status === 1 }) || null
  const next = sessions.find(function (s) { return s.status === 0 }) || null
  return {
    sessions: sessions,
    activeId: active ? active.id : 0,
    nextId: next ? next.id : 0,
    rules: promotions.fullReduceRules
  }
})

// 开抢提醒
on('POST', '/seckill/remind', function (body) {
  const key = String(body.sessionId)
  if (db.state.seckillRemind.indexOf(key) < 0) {
    db.state.seckillRemind.push(key)
    addMessage(3, '抢购提醒已设置', '您预约的秒杀场次开抢前将提醒您，热门零食数量有限，记得准时来抢！', { type: 'seckill', id: '' })
    save()
  }
  return { success: true, reminded: db.state.seckillRemind.slice() }
})

/* ---------- 拼团 ---------- */
function expireGroups() {
  let changed = false
  const pools = [activeGroups, db.state.openedGroups, db.state.joinedGroups]
  pools.forEach(function (pool) {
    pool.forEach(function (g) {
      if (g.status === 1 && g.endTime < Date.now()) {
        g.status = 3 // 未成团，自动退款
        changed = true
        addMessage(1, '拼团未成功', '「' + g.name + '」拼团超时未成团，退款已原路退回（演示，不产生真实交易）。', { type: 'group', id: g.id })
      }
    })
  })
  if (changed) save()
}

function findGroup(id) {
  expireGroups()
  let g = activeGroups.find(function (x) { return x.id == id })
  if (g) return { group: g, pool: activeGroups }
  g = db.state.openedGroups.find(function (x) { return x.id == id })
  if (g) return { group: g, pool: db.state.openedGroups }
  g = db.state.joinedGroups.find(function (x) { return x.id == id })
  if (g) return { group: g, pool: db.state.joinedGroups }
  return null
}

function groupSlots(g) {
  const slots = []
  for (let i = 0; i < g.requiredCount; i++) slots.push(g.members[i] || { empty: true })
  return slots
}

function decorateGroup(g, options) {
  options = options || {}
  const out = JSON.parse(JSON.stringify(g))
  out.slots = groupSlots(out)
  out.remain = Math.max(0, out.requiredCount - out.joinedCount)
  out.mine = !!options.mine
  return out
}

on('GET', '/group/list', function (q) {
  expireGroups()
  if (q.tab === 'mine') {
    const mine = db.state.joinedGroups.concat(db.state.openedGroups).sort(function (a, b) {
      return a.id < b.id ? 1 : -1
    })
    return mine.map(function (g) { return decorateGroup(g, { mine: true }) })
  }
  const list = activeGroups.filter(function (g) { return g.status === 1 })
    .concat(db.state.openedGroups.filter(function (g) { return g.status === 1 }))
  return list.map(function (g) { return decorateGroup(g) })
})

on('GET', '/group/detail', function (q) {
  const found = findGroup(q.id)
  if (!found) throw new Error('拼团不存在或已结束')
  const mine = db.state.joinedGroups.some(function (x) { return x.id == q.id }) ||
    db.state.openedGroups.some(function (x) { return x.id == q.id })
  return decorateGroup(found.group, { mine: mine })
})

// 开团（选择商品直接发起）
on('POST', '/group/open', function (body) {
  const g = goodsMap[body.goodsId]
  if (!g) throw new Error('商品不存在')
  const u = db.state.user
  const requiredCount = Number(body.requiredCount) || 3
  const id = db.nextId('groupBizId')
  const group = {
    id: id,
    goodsId: g.id,
    name: g.name,
    pic: g.pic,
    groupPrice: r2(g.price * 0.82),
    originalPrice: g.price,
    requiredCount: requiredCount,
    joinedCount: 1,
    status: 1,
    members: [{ avatar: u.avatar, name: u.nickName, isLeader: true }],
    endTime: util.hoursLater(24),
    joined: true,
    leaderId: u.id,
    inviterRewarded: false,
    rules: requiredCount + ' 人成团，24 小时未成团自动退款'
  }
  db.state.openedGroups.unshift(group)
  addMessage(1, '开团成功', '您发起的「' + g.name + '」拼团已创建，快邀请好友参团吧！', { type: 'group', id: id })
  save()
  return { success: true, group: decorateGroup(group, { mine: true }) }
})

function doJoinGroup(g, member) {
  if (g.status !== 1) throw new Error('该团已结束')
  if (g.joinedCount >= g.requiredCount) throw new Error('该团已成团')
  g.members.push(member || { avatar: db.state.user.avatar, name: db.state.user.nickName, isLeader: false })
  g.joinedCount += 1
  let completed = false
  if (g.joinedCount >= g.requiredCount) {
    g.status = 2
    completed = true
    addMessage(1, '拼团成功', '您参与的「' + g.name + '」拼团已成团，商品正在打包发货！', { type: 'group', id: g.id })
  }
  const snapshot = JSON.parse(JSON.stringify(g))
  snapshot.joined = true
  const existIdx = db.state.joinedGroups.findIndex(function (x) { return x.id === g.id })
  if (existIdx > -1) db.state.joinedGroups[existIdx] = snapshot
  else db.state.joinedGroups.unshift(snapshot)
  return completed
}

on('POST', '/group/join', function (body) {
  const found = findGroup(body.id)
  if (!found) throw new Error('拼团活动不存在')
  const completed = doJoinGroup(found.group)
  save()
  return { success: true, group: decorateGroup(found.group, { mine: true }), completed: completed }
})

// 演示：模拟一位好友参团
on('POST', '/group/simulateJoin', function (body) {
  const found = findGroup(body.id)
  if (!found) throw new Error('拼团不存在')
  const fakeNames = ['零***食', '小***喵', '爱***吃', '可***乐', '团***团']
  const n = found.group.members.length
  const member = {
    avatar: '/static/mock/avatar/av0' + ((n % 6) + 1) + '.png',
    name: fakeNames[n % fakeNames.length],
    isLeader: false,
    simulated: true
  }
  let completed = false
  try {
    completed = doJoinGroup(found.group, member)
  } catch (e) {
    throw e
  }
  save()
  return { success: true, group: decorateGroup(found.group, { mine: true }), completed: completed }
})

// 邀请奖励：每个拼团仅可领一次（5 元券 + 50 积分）
on('POST', '/group/inviteReward', function (body) {
  const found = findGroup(body.id)
  if (!found) throw new Error('拼团不存在')
  if (found.group.status !== 2) throw new Error('拼团成功后才可领取邀请奖励')
  if (found.group.inviterRewarded) throw new Error('该团的邀请奖励已领取')
  found.group.inviterRewarded = true
  const t = couponTemplates.find(function (x) { return x.id === 4 })
  db.state.coupons.unshift({
    instanceId: db.nextId('couponInst'),
    templateId: t.id,
    name: t.name,
    type: t.type,
    threshold: t.threshold,
    discount: t.discount,
    scope: t.scope,
    scopeLabel: t.scopeLabel,
    status: 1,
    source: '邀请好友',
    expireTime: expire(20)
  })
  addPoint(6, 50, '邀请好友参与「' + found.group.name + '」拼团奖励')
  addMessage(3, '邀请奖励到账', '好友通过您的分享参团，已获得 50 积分与 1 张 5 元无门槛券！', { type: 'coupon', id: '' })
  save()
  return { success: true, points: 50, couponName: t.name }
})

// 分享商品/拼团得积分（同一对象每天仅一次）
on('POST', '/share/record', function (body) {
  const day = fmtDay(new Date())
  const key = day + '_' + body.type + '_' + body.id
  if (db.state.shareRecords.some(function (r) { return r.key === key })) {
    return { success: true, rewarded: false }
  }
  db.state.shareRecords.push({ key: key, type: body.type, id: body.id, time: fmt(new Date()) })
  if (body.type === 'goods') {
    addPoint(6, 5, '分享商品「' + (goodsMap[body.id] ? goodsMap[body.id].name : '') + '」奖励')
  } else {
    addPoint(6, 10, '分享拼团活动奖励')
  }
  save()
  return { success: true, rewarded: true, points: body.type === 'goods' ? 5 : 10 }
})

/* ---------- 消息 ---------- */
on('GET', '/message/list', function (q) {
  let list = db.state.messages.slice().sort(function (a, b) { return (a.id < b.id ? 1 : -1) })
  if (q.type) list = list.filter(function (m) { return m.type == q.type })
  return paginate(list, q)
})

on('GET', '/message/unreadCount', function () {
  return { count: db.state.messages.filter(function (m) { return !m.isRead }).length }
})

on('POST', '/message/read', function (body) {
  const m = db.state.messages.find(function (x) { return x.id == body.id })
  if (m) m.isRead = true
  save()
  return { success: true }
})

on('POST', '/message/readAll', function (body) {
  db.state.messages.forEach(function (m) {
    if (!body.type || m.type == body.type) m.isRead = true
  })
  save()
  return { success: true }
})

/* ---------- 用户 ---------- */
on('GET', '/user/info', function () {
  return { user: db.state.isGuest ? guest : db.state.user, isGuest: db.state.isGuest }
})

on('POST', '/user/login', function () {
  db.state.isGuest = false
  db.state.user = Object.assign({}, db.state.user, JSON.parse(JSON.stringify(userSeed)))
  save()
  return { user: db.state.user, isGuest: false }
})

on('POST', '/user/logout', function () {
  db.state.isGuest = true
  save()
  return { user: guest, isGuest: true }
})

on('POST', '/user/update', function (body) {
  Object.assign(db.state.user, body)
  save()
  return db.state.user
})

// 清除缓存并重置演示数据（设置页使用）
on('POST', '/user/resetCache', function () {
  db.reset()
  return { success: true }
})

/* ---------- 店铺 ---------- */
on('GET', '/shop/info', function () {
  return shop
})

/* ---------- 收藏 ---------- */
on('GET', '/collect/list', function () {
  return db.state.collectIds.map(function (id) { return decorate(goodsMap[id]) }).filter(Boolean)
})

on('POST', '/collect/toggle', function (body) {
  const idx = db.state.collectIds.indexOf(Number(body.goodsId))
  let collected
  if (idx > -1) {
    db.state.collectIds.splice(idx, 1)
    collected = false
  } else {
    db.state.collectIds.push(Number(body.goodsId))
    collected = true
  }
  save()
  return { collected: collected, count: db.state.collectIds.length }
})

/* ---------- 足迹 ---------- */
on('POST', '/footprint/add', function (body) {
  const id = Number(body.goodsId)
  db.state.footprints = db.state.footprints.filter(function (f) { return f.goodsId !== id })
  db.state.footprints.unshift({ goodsId: id, time: fmt(new Date()) })
  if (db.state.footprints.length > 100) db.state.footprints.length = 100
  save()
  return { success: true }
})

on('GET', '/footprint/list', function () {
  const groups = {}
  db.state.footprints.forEach(function (f) {
    const g = goodsMap[f.goodsId]
    if (!g) return
    const day = f.time.slice(0, 10)
    if (!groups[day]) groups[day] = { date: day, items: [] }
    const dg = decorate(g)
    dg.viewTime = f.time.slice(11, 16)
    groups[day].items.push(dg)
  })
  return Object.keys(groups).sort().reverse().map(function (k) { return groups[k] })
})

on('POST', '/footprint/clear', function () {
  db.state.footprints = []
  save()
  return { success: true }
})

/* ---------- 搜索 ---------- */
on('GET', '/search/hot', function () {
  return ['薯片', '巧克力', '每日坚果', '珍珠奶茶', '猪肉脯', '气泡水', '零食礼盒', '进口杏仁']
})

on('GET', '/search/suggest', function (q) {
  const kw = String(q.keywords || '').trim()
  if (!kw) return []
  return goodsList.filter(function (g) {
    return g.name.indexOf(kw) === 0 || g.name.indexOf(kw) > -1
  }).slice(0, 8).map(function (g) {
    return { id: g.id, name: g.name, pic: g.pic, price: g.price }
  })
})

/* ---------- 分发 ---------- */
async function dispatch(method, url, data) {
  await delay()
  const route = routes.find(function (r) { return r.method === method && r.url === url })
  if (!route) {
    console.warn('[mock] 未匹配路由：', method, url)
    return { code: 404, msg: '接口不存在：' + method + ' ' + url, data: null }
  }
  try {
    const d = await route.handler(data || {})
    return { code: 200, data: d, msg: 'success' }
  } catch (e) {
    console.error('[mock 异常]', url, e)
    return { code: 500, msg: e.message || '服务异常', data: null }
  }
}

module.exports = {
  dispatch: dispatch
}
