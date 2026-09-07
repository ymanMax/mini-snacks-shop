// mock/data/shopReviews.js —— 店铺评价
// shopReview: id, orderId, userId, userName, avatar, scores:{fresh,speed,package}, content, createTime

function daysAgo(n, h) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h || 12, 0, 0, 0);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const A = n => '/static/mock/avatar' + n + '.png';

module.exports = [
  { id: 1, orderId: 6, userId: 10002, userName: '肉食主义者', avatar: A(2), scores: { fresh: 5, speed: 5, package: 5 }, content: '配送超快，半小时就到了，肉脯包装很严实。', createTime: daysAgo(1, 9) },
  { id: 2, orderId: 8, userId: 10004, userName: '送礼达人', avatar: A(4), scores: { fresh: 5, speed: 4, package: 5 }, content: '礼盒包装精美，客服态度也很好。', createTime: daysAgo(2, 16) },
  { id: 3, orderId: 10, userId: 10005, userName: '坚果控', avatar: A(5), scores: { fresh: 5, speed: 5, package: 4 }, content: '坚果很新鲜，配送员很有礼貌。', createTime: daysAgo(3, 10) },
  { id: 4, orderId: 5, userId: 10006, userName: '薯片终结者', avatar: A(6), scores: { fresh: 4, speed: 5, package: 5 }, content: '下单到送达不到一小时，零食没有碎，好评。', createTime: daysAgo(4, 20) },
  { id: 5, orderId: 4, userId: 10009, userName: '甜点星人', avatar: A(3), scores: { fresh: 5, speed: 4, package: 5 }, content: '曲奇铁盒外面还套了防撞袋，很用心。', createTime: daysAgo(6, 13) },
  { id: 6, orderId: 2, userId: 10012, userName: '养生少女', avatar: A(6), scores: { fresh: 5, speed: 5, package: 5 }, content: '无限回购的店，品质稳定。', createTime: daysAgo(8, 10) },
  { id: 7, orderId: 1, userId: 10013, userName: '囤货小能手', avatar: A(1), scores: { fresh: 4, speed: 4, package: 4 }, content: '大礼包分量足，就是高峰期配送稍慢了一点。', createTime: daysAgo(9, 21) },
  { id: 8, orderId: 9, userId: 10015, userName: '巧克力脑袋', avatar: A(3), scores: { fresh: 5, speed: 5, package: 5 }, content: '巧克力有冰袋护送，夏天也不怕化，专业！', createTime: daysAgo(11, 14) }
];
