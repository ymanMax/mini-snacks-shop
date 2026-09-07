// mock/data/shopReviews.js —— 店铺评价
const { daysAgo, fmt } = require('../util.js')
const A = function (n) { return '/static/mock/avatar/av0' + n + '.png' }

// [头像, 昵称, 新鲜, 速度, 包装, 内容, 几天前]
const RAW = [
  [1, '兔***叽', 5, 5, 5, '配送超快，40 分钟就送到了，包装完整没有压碎，零食日期都很新鲜。', 1],
  [2, '零***食', 5, 4, 5, '东西不错，小伙子态度很好，下次还会点。', 2],
  [3, '喵***汪', 4, 5, 4, '种类很全，想买的都有，价格实惠，推荐。', 3],
  [4, '甜***心', 5, 5, 5, '礼盒包装很精致，送朋友完全拿得出手，商家还送了小糖果。', 5],
  [5, '可***乐', 5, 4, 4, '满减活动很划算，凑单买了一大堆，够吃一个月了。', 7],
  [6, '健***康', 4, 5, 5, '坚果很新鲜，冷链包装好评，会继续回购。', 9]
]

const shopReviews = RAW.map(function (r, i) {
  return {
    id: i + 1,
    orderId: 3000 + i,
    userName: r[1],
    avatar: A(r[0]),
    scores: { fresh: r[2], speed: r[3], package: r[4] },
    content: r[5],
    createTime: fmt(daysAgo(r[6], 11 + i, 20)),
    reply: i === 0 ? '感谢认可，我们会继续保持新鲜与时效～' : ''
  }
})

module.exports = shopReviews
