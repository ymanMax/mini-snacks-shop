// mock/data/groups.js —— 拼团与团购批发
// groupBuy: id, goodsId, name, pic, groupPrice, originalPrice, requiredCount, joinedCount,
//           status(1拼团中 2已成团 3未成团已退款), members, endTime, rules

function hoursLater(h) {
  const d = new Date(Date.now() + h * 3600000);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const A = n => '/static/mock/avatar' + n + '.png';

module.exports = {
  groups: [
    {
      id: 1, goodsId: 9, name: '每日坚果混合装 30 包', pic: '/static/mock/goods7.png',
      groupPrice: 79.0, originalPrice: 99.0, requiredCount: 3, joinedCount: 2, status: 1,
      members: [{ avatar: A(1), name: '养生少女', isLeader: true }, { avatar: A(4), name: '加班狗', isLeader: false }],
      endTime: hoursLater(18), rules: '3 人成团，24 小时未成团自动退款'
    },
    {
      id: 2, goodsId: 17, name: '蜜汁猪肉脯 3 袋装', pic: '/static/mock/goods15.png',
      groupPrice: 65.0, originalPrice: 79.9, requiredCount: 2, joinedCount: 1, status: 1,
      members: [{ avatar: A(2), name: '肉食主义者', isLeader: true }],
      endTime: hoursLater(9), rules: '2 人成团，24 小时未成团自动退款'
    },
    {
      id: 3, goodsId: 25, name: '零食大礼包 30 包', pic: '/static/mock/goods20.png',
      groupPrice: 55.0, originalPrice: 69.9, requiredCount: 3, joinedCount: 3, status: 2,
      members: [{ avatar: A(3), name: '囤货小能手', isLeader: true }, { avatar: A(5), name: '薯片终结者', isLeader: false }, { avatar: A(6), name: '甜点星人', isLeader: false }],
      endTime: hoursLater(-2), rules: '3 人成团，24 小时未成团自动退款'
    },
    {
      id: 4, goodsId: 18, name: '风干牛肉干 250g', pic: '/static/mock/goods14.png',
      groupPrice: 49.9, originalPrice: 59.9, requiredCount: 2, joinedCount: 1, status: 3,
      members: [{ avatar: A(4), name: '草原的风', isLeader: true }],
      endTime: hoursLater(-30), rules: '2 人成团，24 小时未成团自动退款'
    }
  ],
  wholesale: [
    { id: 1, goodsId: 25, title: '零食大礼包团购批发', pic: '/static/mock/goods20.png', ladder: [{ count: 5, price: 62.0 }, { count: 10, price: 58.0 }, { count: 20, price: 52.0 }] },
    { id: 2, goodsId: 24, title: '臻品坚果礼盒企业团购', pic: '/static/mock/goods19.png', ladder: [{ count: 5, price: 118.0 }, { count: 10, price: 108.0 }, { count: 50, price: 98.0 }] }
  ]
};
