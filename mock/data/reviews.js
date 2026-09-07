// mock/data/reviews.js —— 商品评价 20+ 条
// review: id, orderId, goodsId, userId, userName, avatar, score, tags, content, images, createTime

function daysAgo(n, h) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h || 12, 30, 0, 0);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const A = n => '/static/mock/avatar' + n + '.png';
const G = n => '/static/mock/goods' + n + '.png';

module.exports = [
  { id: 1, orderId: 6, goodsId: 17, userId: 10002, userName: '肉食主义者', avatar: A(2), score: 5, tags: ['口感好', '分量足', '包装好'], content: '猪肉脯蜜汁味很正，不会太甜，肉片厚实有嚼劲，回购第三次了！', images: [G(15), G(13)], createTime: daysAgo(1, 9) },
  { id: 2, orderId: 6, goodsId: 17, userId: 10003, userName: '小吃货一枚', avatar: A(3), score: 4, tags: ['新鲜'], content: '味道不错，就是香辣味有点偏辣，能吃辣的可以冲。', images: [], createTime: daysAgo(2, 14) },
  { id: 3, orderId: 8, goodsId: 24, userId: 10004, userName: '送礼达人', avatar: A(4), score: 5, tags: ['包装好', '个头大'], content: '礼盒特别大气，烫金的盒子送人很有面子，坚果日期也很新鲜。', images: [G(19)], createTime: daysAgo(2, 16) },
  { id: 4, orderId: 10, goodsId: 10, userId: 10005, userName: '坚果控', avatar: A(5), score: 5, tags: ['新鲜', '口感好'], content: '腰果颗粒饱满，炭烧味很香，一罐很快就吃完了。', images: [G(8)], createTime: daysAgo(3, 10) },
  { id: 5, orderId: 10, goodsId: 14, userId: 10005, userName: '坚果控', avatar: A(5), score: 4, tags: ['低糖健康'], content: '苏打饼咸香松脆，配牛奶当早餐很合适。', images: [], createTime: daysAgo(3, 10) },
  { id: 6, orderId: 5, goodsId: 1, userId: 10006, userName: '薯片终结者', avatar: A(6), score: 5, tags: ['酥脆', '新鲜'], content: '原切的就是香！烧烤味yyds，比超市便宜还送到家。', images: [G(1), G(2)], createTime: daysAgo(4, 20) },
  { id: 7, orderId: 5, goodsId: 27, userId: 10006, userName: '薯片终结者', avatar: A(6), score: 5, tags: ['口感好'], content: '海苔大片酥脆，辣味刚刚好，追剧绝配。', images: [], createTime: daysAgo(4, 20) },
  { id: 8, orderId: 3, goodsId: 18, userId: 10007, userName: '草原的风', avatar: A(1), score: 5, tags: ['真材实料', '有嚼劲'], content: '牛肉干是正经牛肉，纹理清晰，麻辣味越嚼越香，就是有点费腮帮子哈哈。', images: [G(14)], createTime: daysAgo(5, 11) },
  { id: 9, orderId: 3, goodsId: 22, userId: 10008, userName: '气泡水爱好者', avatar: A(2), score: 4, tags: ['清爽'], content: '白桃味很清新，0糖喝着没负担，冰镇后更好喝。', images: [], createTime: daysAgo(5, 15) },
  { id: 10, orderId: 4, goodsId: 13, userId: 10009, userName: '甜点星人', avatar: A(3), score: 5, tags: ['奶香浓', '包装好'], content: '曲奇入口即化，黄油味很正，铁盒还能留着装东西。', images: [G(11)], createTime: daysAgo(6, 13) },
  { id: 11, orderId: 4, goodsId: 13, userId: 10010, userName: '饼干怪兽', avatar: A(4), score: 4, tags: ['口感好'], content: '抹茶味微苦回甘，不错。', images: [], createTime: daysAgo(7, 9) },
  { id: 12, orderId: 7, goodsId: 16, userId: 10011, userName: '蛋黄酥本酥', avatar: A(5), score: 5, tags: ['新鲜', '个头大'], content: '蛋黄酥是现烤的口感，酥皮层次分明，整颗蛋黄超满足！', images: [G(10), G(11)], createTime: daysAgo(7, 18) },
  { id: 13, orderId: 7, goodsId: 21, userId: 10011, userName: '蛋黄酥本酥', avatar: A(5), score: 5, tags: ['冷链新鲜'], content: '酸奶浓稠，黄桃燕麦口味料很足。', images: [], createTime: daysAgo(7, 18) },
  { id: 14, orderId: 2, goodsId: 9, userId: 10012, userName: '养生少女', avatar: A(6), score: 5, tags: ['配比科学', '新鲜'], content: '每天一包很方便，坚果和果干搭配刚刚好，办公室抽屉常备。', images: [G(7)], createTime: daysAgo(8, 10) },
  { id: 15, orderId: 1, goodsId: 25, userId: 10013, userName: '囤货小能手', avatar: A(1), score: 5, tags: ['超值', '分量足'], content: '30包整整一箱，什么都有，朋友聚会拿出来大家都抢着吃。', images: [G(20)], createTime: daysAgo(9, 21) },
  { id: 16, orderId: 1, goodsId: 6, userId: 10013, userName: '囤货小能手', avatar: A(1), score: 4, tags: ['Q弹'], content: '软糖果汁味浓，不粘牙，小朋友很爱吃。', images: [], createTime: daysAgo(9, 21) },
  { id: 17, orderId: 11, goodsId: 29, userId: 10014, userName: '韩流零食控', avatar: A(2), score: 5, tags: ['甜咸上头'], content: '蜂蜜黄油味真的绝，甜咸交织，一包根本不够吃。', images: [G(22)], createTime: daysAgo(10, 19) },
  { id: 18, orderId: 9, goodsId: 5, userId: 10015, userName: '巧克力脑袋', avatar: A(3), score: 5, tags: ['丝滑', '纯可可脂'], content: '85%的很醇，微苦回甘，配黑咖啡一流。', images: [G(4)], createTime: daysAgo(11, 14) },
  { id: 19, orderId: 9, goodsId: 5, userId: 10016, userName: '甜蜜负担', avatar: A(4), score: 4, tags: ['包装好'], content: '72%的对新手友好，礼盒精致，下次买来送人。', images: [], createTime: daysAgo(12, 16) },
  { id: 20, orderId: 2, goodsId: 9, userId: 10017, userName: '加班狗', avatar: A(5), score: 5, tags: ['新鲜', '分量足'], content: '每天下午一包，补充能量继续搬砖。', images: [], createTime: daysAgo(13, 15) },
  { id: 21, orderId: 4, goodsId: 13, userId: 10018, userName: '下午茶博主', avatar: A(6), score: 5, tags: ['颜值高', '奶香浓'], content: '拍照巨好看，味道也在线，咖啡味强推！', images: [G(11), G(10)], createTime: daysAgo(14, 17) },
  { id: 22, orderId: 8, goodsId: 24, userId: 10019, userName: '孝顺女儿', avatar: A(1), score: 5, tags: ['送礼优选'], content: '给爸妈买的，他们说坚果品质很好，盒子也漂亮。', images: [], createTime: daysAgo(15, 11) }
];
