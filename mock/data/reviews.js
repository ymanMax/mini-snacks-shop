/**
 * 商品评价 Mock 数据（24 条，字段与 4.5 review 对齐）
 */
const { fmt } = require('../_time.js');

const AV = (n) => '/static/mock/avatar-' + (((n - 1) % 6) + 1) + '.png';
const PIC = (n) => '/static/mock/goods-' + (((n - 1) % 18) + 1) + '.png';

const TAG_POOL = ['新鲜', '口感甜', '包装好', '个头大', '酥脆可口', '日期新鲜', '分量足', '物流快', '性价比高', '会回购'];

const reviews = [
  { id: 1, orderId: 8, goodsId: 10, userId: 20001, userName: '坚***控', avatar: AV(1), score: 5, tags: ['新鲜', '包装好', '分量足'], content: '独立小包装很方便，每天一包带去公司，坚果很新鲜，果干也好吃，会回购！', images: [PIC(10), PIC(11)], createTime: fmt(-4, 'YYYY-MM-DD HH:mm') },
  { id: 2, orderId: 9, goodsId: 5, userId: 20002, userName: '辣***妹', avatar: AV(2), score: 5, tags: ['口感甜', '性价比高'], content: '辣条绝了，麻辣鲜香，一口回到童年，分量也足。', images: [PIC(2)], createTime: fmt(-10, 'YYYY-MM-DD HH:mm') },
  { id: 3, orderId: 9, goodsId: 21, userId: 20003, userName: '吃***王', avatar: AV(3), score: 4, tags: ['物流快'], content: '鸭脖味道不错，就是对我来说有点辣，其他都挺好。', images: [], createTime: fmt(-10, 'YYYY-MM-DD HH:mm') },
  { id: 4, orderId: 10, goodsId: 31, userId: 20004, userName: '芒***头', avatar: AV(4), score: 5, tags: ['新鲜', '个头大'], content: '芒果干超大片，无添加蔗糖吃着放心，酸甜适中。', images: [PIC(13)], createTime: fmt(-19, 'YYYY-MM-DD HH:mm') },
  { id: 5, orderId: 8, goodsId: 11, userId: 20005, userName: '小***子', avatar: AV(5), score: 4, tags: ['酥脆可口'], content: '核桃仁很酥脆，焦糖味不齁，罐子密封也好。', images: [], createTime: fmt(-4, 'YYYY-MM-DD HH:mm') },
  { id: 6, orderId: 7, goodsId: 1, userId: 20006, userName: '追***人', avatar: AV(6), score: 5, tags: ['酥脆可口', '性价比高', '会回购'], content: '薯片很脆，原味最经典，追剧必备，价格实惠。', images: [PIC(1), PIC(3)], createTime: fmt(-1, 'YYYY-MM-DD HH:mm') },
  { id: 7, orderId: 6, goodsId: 19, userId: 20007, userName: '肉***饭', avatar: AV(1), score: 5, tags: ['新鲜', '分量足'], content: '猪肉脯薄薄一片，炭烤香味浓，蜜汁味甜咸刚好。', images: [PIC(1)], createTime: fmt(-3, 'YYYY-MM-DD HH:mm') },
  { id: 8, orderId: 5, goodsId: 15, userId: 20008, userName: '甜***圈', avatar: AV(2), score: 5, tags: ['包装好', '口感甜'], content: '黄油味很浓，酥得掉渣，礼盒装送人也体面。', images: [PIC(15)], createTime: fmt(-6, 'YYYY-MM-DD HH:mm') },
  { id: 9, orderId: 4, goodsId: 23, userId: 20009, userName: '气***泡', avatar: AV(3), score: 4, tags: ['物流快'], content: '气泡足，白桃味清新，0糖0脂喝着没负担。', images: [], createTime: fmt(-8, 'YYYY-MM-DD HH:mm') },
  { id: 10, orderId: 3, goodsId: 12, userId: 20010, userName: '夏***果', avatar: AV(4), score: 5, tags: ['个头大', '新鲜'], content: '夏威夷果颗粒很大，开口好剥，奶油味香浓。', images: [PIC(12)], createTime: fmt(-9, 'YYYY-MM-DD HH:mm') },
  { id: 11, orderId: 2, goodsId: 10, userId: 20011, userName: '养***生', avatar: AV(5), score: 5, tags: ['新鲜', '日期新鲜'], content: '生产日期很近，六种坚果配比科学，孩子也爱吃。', images: [], createTime: fmt(-12, 'YYYY-MM-DD HH:mm') },
  { id: 12, orderId: 1, goodsId: 4, userId: 20012, userName: '爆***花', avatar: AV(6), score: 4, tags: ['口感甜'], content: '焦糖爆米花甜度刚好，就是吃多了有点黏牙。', images: [PIC(4)], createTime: fmt(-13, 'YYYY-MM-DD HH:mm') },
  { id: 13, orderId: 12, goodsId: 1, userId: 20013, userName: '零***库', avatar: AV(1), score: 5, tags: ['酥脆可口', '会回购'], content: '烧烤味薯片yyds，一次买了三袋不够吃。', images: [], createTime: fmt(-15, 'YYYY-MM-DD HH:mm') },
  { id: 14, orderId: 11, goodsId: 18, userId: 20014, userName: '巧***力', avatar: AV(2), score: 5, tags: ['包装好', '口感甜'], content: '夹心饼干巧克力味浓郁，独立包装不怕受潮。', images: [PIC(18)], createTime: fmt(-16, 'YYYY-MM-DD HH:mm') },
  { id: 15, orderId: 10, goodsId: 20, userId: 20015, userName: '草***风', avatar: AV(3), score: 5, tags: ['新鲜', '分量足'], content: '牛肉干有嚼劲，越嚼越香，原味最耐吃。', images: [], createTime: fmt(-18, 'YYYY-MM-DD HH:mm') },
  { id: 16, orderId: 9, goodsId: 25, userId: 20016, userName: '奶***昔', avatar: AV(4), score: 4, tags: ['物流快', '日期新鲜'], content: '酸奶口感顺滑，整箱买划算，希望多做活动。', images: [PIC(7)], createTime: fmt(-20, 'YYYY-MM-DD HH:mm') },
  { id: 17, orderId: 8, goodsId: 27, userId: 20017, userName: '送***手', avatar: AV(5), score: 5, tags: ['包装好'], content: '大礼包送朋友的，包装大气，十种零食很丰富。', images: [PIC(9), PIC(10)], createTime: fmt(-22, 'YYYY-MM-DD HH:mm') },
  { id: 18, orderId: 7, goodsId: 7, userId: 20018, userName: '软***糖', avatar: AV(6), score: 4, tags: ['口感甜', '性价比高'], content: '软糖Q弹，酸甜可口，小朋友很喜欢。', images: [], createTime: fmt(-24, 'YYYY-MM-DD HH:mm') },
  { id: 19, orderId: 6, goodsId: 30, userId: 20019, userName: '黑***控', avatar: AV(1), score: 5, tags: ['新鲜'], content: '72%黑巧醇苦回甘，配咖啡绝了，进口品质。', images: [PIC(12)], createTime: fmt(-26, 'YYYY-MM-DD HH:mm') },
  { id: 20, orderId: 5, goodsId: 13, userId: 20020, userName: '核***桃', avatar: AV(2), score: 5, tags: ['个头大', '新鲜'], content: '纸皮核桃真的手捏就开，果仁饱满没有坏果。', images: [], createTime: fmt(-28, 'YYYY-MM-DD HH:mm') },
  { id: 21, orderId: 4, goodsId: 23, userId: 20021, userName: '减***期', avatar: AV(3), score: 5, tags: ['性价比高', '会回购'], content: '无糖气泡水回购第三次了，白桃味最好喝。', images: [PIC(5)], createTime: fmt(-30, 'YYYY-MM-DD HH:mm') },
  { id: 22, orderId: 3, goodsId: 16, userId: 20022, userName: '早***八', avatar: AV(4), score: 3, tags: ['物流快'], content: '苏打饼干味道还行，就是碎了几片，物流很快。', images: [], createTime: fmt(-32, 'YYYY-MM-DD HH:mm') },
  { id: 23, orderId: 2, goodsId: 28, userId: 20023, userName: '生***日', avatar: AV(5), score: 5, tags: ['包装好', '分量足'], content: '28件装超大一箱，生日派对氛围担当！', images: [PIC(10), PIC(11)], createTime: fmt(-34, 'YYYY-MM-DD HH:mm') },
  { id: 24, orderId: 1, goodsId: 26, userId: 20024, userName: '茶***客', avatar: AV(6), score: 4, tags: ['性价比高'], content: '冰红茶经典味道，配火锅解腻，价格比超市便宜。', images: [], createTime: fmt(-36, 'YYYY-MM-DD HH:mm') }
];

module.exports = { reviews, TAG_POOL };
