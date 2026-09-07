// mock/data/groups.js —— 拼团活动（3 人成团 / 24 小时未成团自动退款）
const { round2, offsetTime } = require('../util');

// [goodsId, 成团人数, 已参团人数, 团长名, 团长头像索引, 结束剩余小时]
const GROUP_SEED = [
  [25, 3, 2, '小馋猫', 2, 6],
  [29, 3, 1, '火鸡面本面', 6, 11],
  [9, 2, 1, '坚果达人', 3, 20],
  [18, 3, 2, '无辣不欢', 6, 3],
  [32, 2, 1, '威化星人', 5, 15]
];

function buildGroups(goodsList) {
  return GROUP_SEED.map(([gid, requiredCount, joinedCount, leaderName, avatarIdx, leftHours], idx) => {
    const g = goodsList.find((x) => x.id === gid);
    const members = [{
      userId: 20000 + avatarIdx,
      name: leaderName,
      avatar: `/static/mock/avatar${avatarIdx}.jpg`,
      isLeader: true
    }];
    for (let i = 1; i < joinedCount; i++) {
      const ai = ((avatarIdx + i) % 6) + 1;
      members.push({
        userId: 20000 + ai,
        name: ['乐乐', 'Amy', '零食收割机'][i - 1] || '团友',
        avatar: `/static/mock/avatar${ai}.jpg`,
        isLeader: false
      });
    }
    return {
      id: 5001 + idx,
      goodsId: gid,
      name: g.name,
      pic: g.pic,
      groupPrice: round2(g.price * 0.8),
      originalPrice: g.price,
      requiredCount,
      joinedCount: members.length,
      remainCount: requiredCount - members.length,
      status: 1, // 1拼团中
      members,
      endTime: offsetTime(0, leftHours),
      leftSeconds: leftHours * 3600,
      rules: '3 人成团享拼团价，24 小时未成团自动退款'
    };
  });
}

// 我的拼团（已参团：进行中/已成团/未成团已退款）
function buildMyGroups(goodsList) {
  const all = buildGroups(goodsList);
  const joined = Object.assign({}, all[0], {
    myJoined: true,
    status: 1
  });
  const done = Object.assign({}, all[2], {
    id: 5099,
    myJoined: true,
    status: 2,
    joinedCount: 2,
    remainCount: 0
  });
  const failed = Object.assign({}, all[1], {
    id: 5098,
    myJoined: true,
    status: 3,
    joinedCount: 1,
    remainCount: 2,
    refund: {
      status: '已原路退回',
      amount: round2(all[1].groupPrice),
      time: offsetTime(-2),
      desc: '24 小时未成团，款项已原路退回'
    }
  });
  return [joined, done, failed];
}

module.exports = { buildGroups, buildMyGroups };
