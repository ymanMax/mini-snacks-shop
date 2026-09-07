// mock/data/shopReviews.js —— 店铺评价
const { offsetTime } = require('../util');

const SHOP_R = [
  ['小馋猫', 2, [5, 5, 4], '水果和零食都很新鲜，配送员提前电话联系，包装完整，还会再来！', 2],
  ['零食收割机', 4, [5, 5, 5], '45 分钟就到了，冰袋还硬邦邦的，必须满分。', 1],
  ['乐乐', 6, [4, 5, 5], '速度很快，商品和图片一致，活动价格很划算。', 0],
  ['坚果达人', 3, [5, 4, 5], '坚果日期很新，就是配送稍微晚了十分钟，整体满意。', 1],
  ['Amy', 5, [5, 5, 4], '包装很用心，气泡膜裹得严实，客服态度也好。', 0],
  ['无辣不欢', 1, [5, 5, 5], '锁鲜装很新鲜，冷链名不虚传，推荐！', 2]
];

const NAME_AVATARS = {
  1: '/static/mock/avatar1.jpg', 2: '/static/mock/avatar2.jpg', 3: '/static/mock/avatar3.jpg',
  4: '/static/mock/avatar4.jpg', 5: '/static/mock/avatar5.jpg', 6: '/static/mock/avatar6.jpg'
};

const shopReviews = SHOP_R.map((r, idx) => {
  const [userName, avatarIdx, scores, content, imgCount] = r;
  const images = [];
  for (let i = 0; i < imgCount; i++) images.push(`/static/mock/u${(idx + i) % 8 + 1}.jpg`);
  return {
    id: 40001 + idx,
    orderId: 20001 + idx,
    userId: 20000 + avatarIdx,
    userName,
    avatar: NAME_AVATARS[avatarIdx],
    scores: { fresh: scores[0], speed: scores[1], package: scores[2] },
    content,
    images,
    createTime: offsetTime(-(idx + 1), -idx)
  };
});

module.exports = shopReviews;
