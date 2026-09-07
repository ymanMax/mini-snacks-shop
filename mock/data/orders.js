// mock/data/orders.js —— 11 条订单，覆盖全部 6 种状态
const { goodsList, G } = require('./goods.js')
const addresses = require('./addresses.js')
const { r2, daysAgo, hoursAgo, fmt, orderNo } = require('../util.js')

const goodsMap = {}
goodsList.forEach(function (g) { goodsMap[g.id] = g })

const RIDERS = [
  { name: '王师傅', phone: '138****1024' },
  { name: '李师傅', phone: '139****2048' }
]

function makeItems(rows) {
  // rows: [goodsId, count, specLabelIndex, flavor]
  return rows.map(function (r) {
    const g = goodsMap[r[0]]
    const spec = g.specs[0].values[r[2] || 0]
    const flavor = r[3] != null ? r[3] : 1
    const flavorLabel = g.specs[1].values[flavor] ? g.specs[1].values[flavor].label : ''
    return {
      goodsId: g.id,
      name: g.name,
      pic: spec.pic || g.pic,
      specText: spec.label + ' · ' + flavorLabel,
      price: spec.price,
      count: r[1]
    }
  })
}

function calcFreight(total, distance) {
  if (total >= 59) return 0
  let fee = 5
  if (distance > 3) fee = r2(5 + Math.ceil(distance - 3) * 1)
  return fee
}

function buildTimeline(status, created, stages) {
  const t = function (h, m) {
    const d = new Date(created.getTime())
    d.setMinutes(d.getMinutes() + m)
    return fmt(d)
  }
  const list = [{ time: fmt(created), status: '订单已提交', remark: '订单已提交，等待买家付款' }]
  if (status === 6) {
    list.push({ time: t(0, 30), status: '订单已取消', remark: '买家主动取消订单' })
    return list
  }
  list.push({ time: t(0, 2), status: '支付完成', remark: '微信支付成功（演示环境，不产生真实交易）' })
  if (status >= 2) {
    list.push({ time: t(0, 15), status: '商家分拣', remark: '商家正在拣货打包，请耐心等待' })
  }
  if (status >= 3) {
    list.push({ time: t(0, 32), status: '骑手取货', remark: stages.rider.name + ' 已取货，正在飞奔配送中' })
  }
  if (status >= 4) {
    list.push({ time: t(0, 45), status: '配送中', remark: '骑手已到达您附近，请保持电话畅通' })
  }
  if (status >= 5) {
    list.push({ time: t(0, 52), status: '已送达', remark: '订单已送达，祝您用餐愉快' })
  }
  return list
}

// seq, status, created, rows(商品), opts{addressIndex, coupon:{title,amount}, slot, remark, payType, reviewed, rider, distance}
function makeOrder(seq, status, created, rows, opts) {
  opts = opts || {}
  const items = makeItems(rows)
  const goodsTotal = r2(items.reduce(function (s, it) { return s + it.price * it.count }, 0))
  const addr = addresses[opts.addressIndex || 0]
  const distance = opts.distance != null ? opts.distance : addr.distanceKm
  // 满减阶梯（59-8/99-20/199-50）
  let fullReduce = 0
  if (goodsTotal >= 199) fullReduce = 50
  else if (goodsTotal >= 99) fullReduce = 20
  else if (goodsTotal >= 59) fullReduce = 8
  let couponDiscount = opts.coupon ? opts.coupon.amount : 0
  const discountAmount = r2(fullReduce + couponDiscount)
  const freight = status === 6 ? 0 : calcFreight(goodsTotal - discountAmount, distance)
  const payAmount = r2(goodsTotal - discountAmount + freight)
  const rider = opts.rider != null ? RIDERS[opts.rider] : (status >= 3 ? RIDERS[seq % 2] : null)
  return {
    id: 30000 + seq,
    orderNo: orderNo(seq),
    status: status,
    items: items,
    goodsTotal: goodsTotal,
    totalAmount: goodsTotal,
    fullReduce: fullReduce,
    discountAmount: discountAmount,
    couponId: opts.coupon ? opts.coupon.id : 0,
    couponTitle: opts.coupon ? opts.coupon.title : '',
    freight: freight,
    payAmount: payAmount,
    payType: opts.payType || 1,
    remark: opts.remark || '',
    deliveryDate: fmt(created).slice(0, 10),
    deliverySlot: opts.slot || '尽快送达（预计45分钟）',
    addressSnapshot: {
      name: addr.name,
      phone: addr.phone,
      fullAddress: addr.province + addr.city + addr.district + addr.detail,
      tag: addr.tag,
      distanceKm: distance
    },
    rider: rider,
    timeline: buildTimeline(status, created, { rider: rider || RIDERS[0] }),
    isReviewed: !!opts.reviewed,
    createTime: fmt(created),
    _ts: created.getTime()
  }
}

const orders = [
  makeOrder(11, 1, hoursAgo(3), [[23, 6, 0, 2]], { remark: '冰镇一下，谢谢', slot: '尽快送达（预计45分钟）' }),
  makeOrder(10, 1, daysAgo(1, 16, 20), [[5, 1, 0, 0], [7, 2, 0, 2]], { slot: '今天 18:00-20:00' }),
  makeOrder(9, 2, hoursAgo(20), [[17, 2, 0, 1], [19, 1, 0, 1]], { payType: 2, remark: '不吃香菜' }),
  makeOrder(8, 2, daysAgo(2, 11, 5), [[10, 2, 0, 0]], { slot: '今天 14:00-16:00' }),
  makeOrder(7, 3, hoursAgo(1), [[25, 1, 0, 0]], { fullReduceNoCoupon: true, addressIndex: 0 }),
  makeOrder(6, 4, hoursAgo(2), [[13, 2, 0, 0], [14, 1, 0, 1]], { addressIndex: 1 }),
  makeOrder(5, 5, daysAgo(8, 13, 40), [[1, 2, 0, 1], [23, 3, 0, 2]], { reviewed: true }),
  makeOrder(4, 5, daysAgo(2, 19, 10), [[9, 1, 0, 0], [11, 1, 0, 1]], { reviewed: false, coupon: { id: 4, title: '5元无门槛券', amount: 5 } }),
  makeOrder(3, 5, daysAgo(12, 12, 0), [[10, 1, 0, 0]], { reviewed: true, slot: '今天 10:00-12:00' }),
  makeOrder(2, 5, daysAgo(20, 20, 30), [[28, 1, 0, 0], [1, 3, 1, 1]], { reviewed: true }),
  makeOrder(1, 6, daysAgo(15, 9, 15), [[31, 2, 0, 2]], {})
]

module.exports = orders
