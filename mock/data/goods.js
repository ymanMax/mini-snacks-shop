// mock/data/goods.js —— 30+ 条商品（含多图、视频、规格、产地、标签）
// 金额统一为数字（元，两位小数）

const VIDEOS = [
  'https://media.w3.org/2010/05/sierra/movie_300.mp4',
  'https://media.w3.org/2010/05/bunny/movie_300.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4'
];

const DETAILS = [
  '/static/mock/detail1.png',
  '/static/mock/detail2.png',
  '/static/mock/detail3.png',
  '/static/mock/detail4.png'
];

function g(id) {
  return '/static/mock/goods' + id + '.png';
}

// specs 构造器：规格（带价格/库存） + 口味
function specs(priceList, flavors) {
  return [
    {
      name: '规格',
      values: priceList.map(p => ({
        label: p[0],
        price: p[1],
        stock: p[2],
        pic: p[3] || null
      }))
    },
    {
      name: '口味',
      values: flavors.map(f => ({ label: f }))
    }
  ];
}

// 商品快捷构造
function P(o) {
  const pics = [g(o.img)].concat(DETAILS.slice(0, 4));
  const minPrice = Math.min.apply(null, o.specs[0].values.map(v => v.price));
  const maxOriginal = Math.round(minPrice * 1.25 * 100) / 100;
  return {
    id: o.id,
    name: o.name,
    pic: g(o.img),
    pics: pics,
    videoUrl: o.video ? VIDEOS[o.id % VIDEOS.length] : '',
    videoCover: g(o.img),
    videoIntro: o.video ? '实拍试吃 · 看得见的酥脆' : '',
    categoryId: o.cat,
    categoryName: o.catName,
    minPrice: minPrice,
    originalPrice: maxOriginal,
    memberPrice: o.member ? Math.round(minPrice * 0.92 * 100) / 100 : null,
    numberSells: o.sells,
    stock: o.specs[0].values.reduce((s, v) => s + v.stock, 0),
    unit: o.unit,
    origin: o.origin,
    tags: o.tags,
    specs: o.specs,
    description: o.desc,
    detailImages: DETAILS.slice(0, 3),
    viewCount: o.sells * 3 + 200,
    collectCount: Math.floor(o.sells / 5) + 10,
    isCollect: false,
    hot: !!o.hot,
    hotScore: o.sells + (o.hot ? 500 : 0)
  };
}

const CATS = { 1: '膨化食品', 2: '糖果巧克力', 3: '坚果炒货', 4: '饼干糕点', 5: '肉脯肉干', 6: '饮料饮品', 7: '礼盒礼包', 8: '进口零食' };

module.exports = [
  // ===== 膨化食品 =====
  P({ id: 1, name: '原切香脆薯片', img: 1, cat: 1, catName: CATS[1], unit: '袋', origin: '山东', sells: 2380, hot: true, video: true, member: true,
      tags: ['顺丰包邮', '热销爆款', '第二件半价'], desc: '优选高原土豆原切制作，薄脆爽口，咔嚓一声停不下来。',
      specs: specs([['70g*3袋', 15.9, 200], ['70g*6袋', 28.9, 150], ['家庭装 500g', 35.9, 80]], ['原味', '烧烤味', '番茄味']) }),
  P({ id: 2, name: '黄金脆薯条', img: 2, cat: 1, catName: CATS[1], unit: '盒', origin: '内蒙古', sells: 1560, video: true,
      tags: ['产地直发', '热销'], desc: '鲜切马铃薯条低温油炸，根根金黄酥脆。',
      specs: specs([['120g*2盒', 19.9, 120], ['120g*4盒', 36.9, 90]], ['原味', '蜂蜜黄油味']) }),
  P({ id: 3, name: '墨西哥玉米片', img: 3, cat: 1, catName: CATS[1], unit: '袋', origin: '山东', sells: 890,
      tags: ['新品'], desc: '玉米原香浓郁，搭配沙拉酱更美味。',
      specs: specs([['150g*2袋', 22.9, 100]], ['芝士味', '香辣味']) }),
  P({ id: 4, name: '焦糖爆米花', img: 3, cat: 1, catName: CATS[1], unit: '桶', origin: '河南', sells: 670,
      tags: ['观影必备'], desc: '颗颗饱满，焦糖裹衣香甜酥脆。',
      specs: specs([['120g*2桶', 16.9, 160]], ['焦糖味', '奶油味']) }),
  // ===== 糖果巧克力 =====
  P({ id: 5, name: '黑巧克力礼盒装', img: 4, cat: 2, catName: CATS[2], unit: '盒', origin: '广东', sells: 1980, hot: true, video: true, member: true,
      tags: ['顺丰包邮', '纯可可脂'], desc: '72% 纯可可脂黑巧，丝滑微苦回甘。',
      specs: specs([['120g 礼盒', 39.9, 90, null], ['240g 礼盒', 69.9, 60]], ['72%黑巧', '85%黑巧']) }),
  P({ id: 6, name: '果汁软糖混合装', img: 5, cat: 2, catName: CATS[2], unit: '袋', origin: '福建', sells: 2450, video: true,
      tags: ['果汁含量≥30%', '热销'], desc: '真实果汁添加，Q 弹不粘牙。',
      specs: specs([['200g*2袋', 18.9, 220], ['200g*4袋', 34.9, 130]], ['混合水果', '葡萄味', '白桃味']) }),
  P({ id: 7, name: '星空棒棒糖', img: 6, cat: 2, catName: CATS[2], unit: '支', origin: '浙江', sells: 3200,
      tags: ['网红同款', '高颜值'], desc: '星空图案糖体，送礼自用两相宜。',
      specs: specs([['10支装', 25.9, 180], ['20支礼盒', 45.9, 70]], ['混合口味']) }),
  P({ id: 8, name: '特浓牛奶糖', img: 5, cat: 2, catName: CATS[2], unit: '袋', origin: '上海', sells: 1100,
      tags: ['童年回忆'], desc: '奶香浓郁，甜而不腻。',
      specs: specs([['250g*2袋', 21.9, 140]], ['原味']) }),
  // ===== 坚果炒货 =====
  P({ id: 9, name: '每日坚果混合装', img: 7, cat: 3, catName: CATS[3], unit: '箱', origin: '新疆', sells: 3680, hot: true, video: true, member: true,
      tags: ['顺丰包邮', '产地直发', '热销爆款'], desc: '6 种坚果 + 3 种果干科学配比，一天一包元气满满。',
      specs: specs([['25g*7包', 29.9, 200], ['25g*30包 整箱', 99.0, 90]], ['经典混合', '蔓越莓混合']) }),
  P({ id: 10, name: '炭烧腰果', img: 8, cat: 3, catName: CATS[3], unit: '罐', origin: '云南', sells: 1420, member: true,
      tags: ['大颗粒', '坏果包赔'], desc: '越南大腰果炭烧工艺，咸香酥脆。',
      specs: specs([['250g*1罐', 35.9, 110], ['250g*2罐', 65.9, 80]], ['炭烧味', '盐焗味']) }),
  P({ id: 11, name: '盐焗开心果', img: 9, cat: 3, catName: CATS[3], unit: '袋', origin: '新疆', sells: 980,
      tags: ['自然开口', '产地直发'], desc: '自然开口率高，果仁饱满翠绿。',
      specs: specs([['200g*2袋', 45.9, 100]], ['盐焗味']) }),
  P({ id: 12, name: '奶油夏威夷果', img: 7, cat: 3, catName: CATS[3], unit: '罐', origin: '广东', sells: 760,
      tags: ['送开口器'], desc: '奶香浓郁，附赠开口器轻松剥壳。',
      specs: specs([['300g*1罐', 42.9, 85]], ['奶油味']) }),
  // ===== 饼干糕点 =====
  P({ id: 13, name: '黄油曲奇礼盒', img: 11, cat: 4, catName: CATS[4], unit: '盒', origin: '广东', sells: 2890, hot: true, video: true, member: true,
      tags: ['顺丰包邮', '进口黄油'], desc: '新西兰黄油打发，入口即化，奶香四溢。',
      specs: specs([['200g 铁盒', 32.9, 150], ['400g 双层礼盒', 59.9, 70]], ['原味', '抹茶味', '咖啡味']) }),
  P({ id: 14, name: '全麦苏打饼干', img: 12, cat: 4, catName: CATS[4], unit: '袋', origin: '江苏', sells: 1350,
      tags: ['低糖', '轻负担'], desc: '全麦粉制作，咸香松脆，代餐好选择。',
      specs: specs([['300g*2袋', 19.9, 170]], ['香葱味', '芝麻味']) }),
  P({ id: 15, name: '巧克力威化', img: 10, cat: 4, catName: CATS[4], unit: '盒', origin: '福建', sells: 1780,
      tags: ['层层酥脆'], desc: '五层威化夹心，巧克力涂层浓郁。',
      specs: specs([['240g*1盒', 23.9, 130]], ['巧克力味', '榛子味']) }),
  P({ id: 16, name: '手工蛋黄酥', img: 11, cat: 4, catName: CATS[4], unit: '盒', origin: '浙江', sells: 2100, video: true,
      tags: ['现烤现发', '短保新鲜'], desc: '整颗咸蛋黄 + 红豆沙，酥皮层次分明。',
      specs: specs([['6枚装', 36.9, 90], ['12枚礼盒', 68.9, 50]], ['红豆沙', '莲蓉']) }),
  // ===== 肉脯肉干 =====
  P({ id: 17, name: '蜜汁猪肉脯', img: 15, cat: 5, catName: CATS[5], unit: '袋', origin: '江苏', sells: 3260, hot: true, member: true,
      tags: ['顺丰包邮', '靖江特产', '热销爆款'], desc: '靖江传统工艺，蜜汁入味，越嚼越香。',
      specs: specs([['200g*1袋', 28.9, 190], ['200g*3袋', 79.9, 100]], ['蜜汁味', '香辣味', '黑椒味']) }),
  P({ id: 18, name: '风干牛肉干', img: 14, cat: 5, catName: CATS[5], unit: '袋', origin: '内蒙古', sells: 2650, video: true, member: true,
      tags: ['产地直发', '真牛肉'], desc: '草原黄牛后腿肉自然风干，七成干有嚼劲。',
      specs: specs([['250g*1袋', 59.9, 80], ['500g*1袋', 109.0, 45]], ['原味', '麻辣味', '孜然味']) }),
  P({ id: 19, name: '低脂鸡胸肉干', img: 13, cat: 5, catName: CATS[5], unit: '袋', origin: '山东', sells: 890,
      tags: ['高蛋白', '健身零食'], desc: '低脂高蛋白，健身代餐无负担。',
      specs: specs([['100g*3袋', 33.9, 120]], ['黑椒味', '奥尔良味']) }),
  // ===== 饮料饮品 =====
  P({ id: 20, name: ' NFC 鲜榨橙汁', img: 16, cat: 6, catName: CATS[6], unit: '箱', origin: '江西', sells: 1520,
      tags: ['顺丰包邮', '0 添加'], desc: '非浓缩还原，一瓶 ≈ 3 个鲜橙。',
      specs: specs([['300ml*6瓶', 39.9, 110], ['300ml*15瓶 整箱', 89.9, 60]], ['原味']) }),
  P({ id: 21, name: '低温风味酸奶', img: 17, cat: 6, catName: CATS[6], unit: '箱', origin: '内蒙古', sells: 1890, video: true,
      tags: ['冷链配送', '活性乳酸菌'], desc: '生牛乳发酵，口感浓稠顺滑。',
      specs: specs([['200g*10盒', 45.9, 100]], ['原味', '黄桃燕麦']) }),
  P({ id: 22, name: '0 糖气泡水', img: 18, cat: 6, catName: CATS[6], unit: '箱', origin: '广东', sells: 2340, hot: true,
      tags: ['0 糖 0 脂', '白桃味'], desc: '0 糖 0 脂 0 卡，气泡绵密清爽解腻。',
      specs: specs([['480ml*6瓶', 29.9, 140], ['480ml*15瓶 整箱', 66.9, 80]], ['白桃味', '青柠味', '葡萄味']) }),
  P({ id: 23, name: '港式丝袜奶茶', img: 16, cat: 6, catName: CATS[6], unit: '箱', origin: '广东', sells: 990,
      tags: ['港味经典'], desc: '茶味浓郁奶香顺滑，冰镇更佳。',
      specs: specs([['280ml*6瓶', 35.9, 90]], ['经典原味']) }),
  // ===== 礼盒礼包 =====
  P({ id: 24, name: '臻品坚果礼盒', img: 19, cat: 7, catName: CATS[7], unit: '盒', origin: '浙江', sells: 1680, hot: true, member: true,
      tags: ['顺丰包邮', '送礼优选', '高端礼盒'], desc: '8 罐装臻品坚果，烫金礼盒，走亲访友体面之选。',
      specs: specs([['1.2kg 礼盒', 128.0, 60], ['1.6kg 豪华礼盒', 168.0, 35]], ['经典款']) }),
  P({ id: 25, name: '零食大礼包 30 包', img: 20, cat: 7, catName: CATS[7], unit: '箱', origin: '浙江', sells: 4520, hot: true, video: true,
      tags: ['销量冠军', '整整 30 包'], desc: '薯片糖果肉脯一箱搞定，追剧囤货必备。',
      specs: specs([['30 包畅享装', 69.9, 120], ['50 包家庭装', 99.0, 70]], ['混合装']) }),
  P({ id: 26, name: '节庆伴手礼', img: 21, cat: 7, catName: CATS[7], unit: '盒', origin: '福建', sells: 760,
      tags: ['可定制贺卡'], desc: '糕点糖果组合，附赠贺卡。',
      specs: specs([['经典伴手礼', 59.9, 55]], ['组合装']) }),
  // ===== 进口零食 =====
  P({ id: 27, name: '泰国脆海苔', img: 23, cat: 8, catName: CATS[8], unit: '袋', origin: '泰国', sells: 2130, video: true,
      tags: ['泰国进口', '咔滋脆'], desc: '泰国原装进口，大片海苔酥脆咸香。',
      specs: specs([['36g*3袋', 29.9, 130]], ['原味', '辣味', '烧烤味']) }),
  P({ id: 28, name: '日本蒟蒻果冻', img: 24, cat: 8, catName: CATS[8], unit: '袋', origin: '日本', sells: 1780,
      tags: ['日本进口', '低卡'], desc: '蒟蒻果冻 Q 弹多汁，低卡无负担。',
      specs: specs([['12枚*2袋', 39.9, 95]], ['白桃味', '葡萄味']) }),
  P({ id: 29, name: '韩国蜂蜜黄油薯片', img: 22, cat: 8, catName: CATS[8], unit: '袋', origin: '韩国', sells: 2650, hot: true,
      tags: ['韩国进口', '网红爆款'], desc: '蜂蜜黄油神仙组合，甜咸交织超上头。',
      specs: specs([['60g*3袋', 32.9, 150]], ['蜂蜜黄油味']) }),
  P({ id: 30, name: '马来西亚白咖啡曲奇', img: 10, cat: 8, catName: CATS[8], unit: '盒', origin: '马来西亚', sells: 890,
      tags: ['马来进口'], desc: '白咖啡香气融入曲奇，风味独特。',
      specs: specs([['180g*2盒', 42.9, 75]], ['白咖啡味']) })
];
