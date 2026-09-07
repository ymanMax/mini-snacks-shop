/**
 * 店铺评价 Mock 数据（8 条，字段与 4.6 shopReview 对齐）
 * scores 三维度：fresh 新鲜度 / speed 配送速度 / package 包装（1~5）
 */
const { fmt } = require('../_time.js');

const AV = (n) => '/static/mock/avatar-' + (((n - 1) % 6) + 1) + '.png';

const shopReviews = [
  { id: 1, orderId: 8, userId: 20001, userName: '坚***控', avatar: AV(1), scores: { fresh: 5, speed: 5, package: 5 }, content: '45分钟就送到了，包装完好，零食日期都很新鲜，好评！', createTime: fmt(-4, 'YYYY-MM-DD HH:mm') },
  { id: 2, orderId: 9, userId: 20002, userName: '辣***妹', avatar: AV(2), scores: { fresh: 5, speed: 4, package: 5 }, content: '骑手小哥很礼貌，就是高峰期稍微慢了一点，整体满意。', createTime: fmt(-10, 'YYYY-MM-DD HH:mm') },
  { id: 3, orderId: 7, userId: 20006, userName: '追***人', avatar: AV(6), scores: { fresh: 5, speed: 5, package: 4 }, content: '常点的店，品质稳定，希望包装气泡膜再厚一点。', createTime: fmt(-1, 'YYYY-MM-DD HH:mm') },
  { id: 4, orderId: 6, userId: 20007, userName: '肉***饭', avatar: AV(1), scores: { fresh: 4, speed: 5, package: 5 }, content: '配送超快，肉脯类真空包装很卫生。', createTime: fmt(-3, 'YYYY-MM-DD HH:mm') },
  { id: 5, orderId: 5, userId: 20008, userName: '甜***圈', avatar: AV(2), scores: { fresh: 5, speed: 4, package: 5 }, content: '曲奇没有碎，铁盒包装很用心，送人没问题。', createTime: fmt(-6, 'YYYY-MM-DD HH:mm') },
  { id: 6, orderId: 10, userId: 20015, userName: '草***风', avatar: AV(3), scores: { fresh: 5, speed: 5, package: 5 }, content: '进口零食也有这么快配送，惊喜，客服响应也快。', createTime: fmt(-18, 'YYYY-MM-DD HH:mm') },
  { id: 7, orderId: 11, userId: 20020, userName: '核***桃', avatar: AV(4), scores: { fresh: 4, speed: 4, package: 4 }, content: '总体不错，核桃个头均匀，会继续回购。', createTime: fmt(-25, 'YYYY-MM-DD HH:mm') },
  { id: 8, orderId: 12, userId: 20023, userName: '生***日', avatar: AV(5), scores: { fresh: 5, speed: 5, package: 5 }, content: '生日派对前一晚下单，第二天上午就送到，救了急！', createTime: fmt(-33, 'YYYY-MM-DD HH:mm') }
];

module.exports = { shopReviews };
