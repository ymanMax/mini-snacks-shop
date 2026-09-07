// mock/data/groups.js —— 拼团活动
const { goodsList } = require('./goods.js')
const { r2, hoursLater, hoursAgo, fmt } = require('../util.js')

const A = function (n) { return '/static/mock/avatar/av0' + n + '.png' }

function make(id, goodsId, requiredCount, joinedCount, hours, joined) {
  const g = goodsList.find(function (x) { return x.id === goodsId })
  const members = [
    { avatar: A(3), name: '团***长', isLeader: true }
  ]
  for (let i = 1; i < joinedCount; i++) {
    members.push({ avatar: A((i % 6) + 1), name: ['零***食', '小***喵', '爱***吃', '可***乐'][i - 1] })
  }
  return {
    id: id,
    goodsId: goodsId,
    name: g.name,
    pic: g.pic,
    groupPrice: r2(g.price * 0.82),
    originalPrice: g.price,
    requiredCount: requiredCount,
    joinedCount: joinedCount,
    status: 1, // 1拼团中 2已成团 3未成团已退款
    members: members,
    endTime: hours > 0 ? hoursLater(hours) : hoursAgo(Math.abs(hours)).getTime(),
    joined: !!joined,
    rules: requiredCount + ' 人成团，24 小时未成团自动退款'
  }
}

const groups = [
  make(1, 25, 3, 2, 6, false),
  make(2, 1, 2, 1, 12, false),
  make(3, 17, 3, 1, 20, false)
]

// 已成团历史（用户参与）
const historyGroup = make(4, 10, 3, 2, -26, true)
historyGroup.status = 2
historyGroup.members.push({ avatar: A(1), name: '零食爱好者', isLeader: false })
historyGroup.joinedCount = 3
historyGroup.successTime = fmt(hoursAgo(2))

module.exports = {
  groups: groups,
  historyGroup: historyGroup
}
