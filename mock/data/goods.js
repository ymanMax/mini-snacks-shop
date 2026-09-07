/**
 * 商品 Mock 数据（33 条）
 * 金额规范：纯数字（元，两位小数），禁止字符串价格
 * 图片规范：本地 static/mock 优先；image 标签需 binderror 回退 /static/images/default.png
 */

// 视频源：稳定公网小体积 mp4，加载失败时前端隐藏视频入口
const VIDEO_1 = 'https://media.w3.org/2010/05/sierra/movie_300.mp4';
const VIDEO_2 = 'https://www.w3schools.com/html/mov_bbb.mp4';

const round2 = (n) => Math.round(n * 100) / 100;

// 本地图循环池（18 张零食主题占位图）
function img(n) {
  return '/static/mock/goods-' + (((n - 1) % 18) + 1) + '.png';
}

// 按单位生成默认规格（规格维度：价格/库存/主图联动）
function defaultSpecs(cfg) {
  const unitSpecs = {
    '袋': [['1袋尝鲜装', 1], ['3袋实惠装', 2.85], ['整箱囤货装', 8.8]],
    '盒': [['1盒装', 1], ['2盒装', 1.9], ['礼盒装', 2.8]],
    '斤': [['3斤装', 1], ['5斤装', 1.6], ['9斤装', 2.75]],
    '瓶': [['6瓶装', 1], ['12瓶装', 1.92], ['24瓶整箱', 3.7]],
    '罐': [['1罐装', 1], ['2罐装', 1.9], ['4罐家庭装', 3.6]],
    '箱': [['小箱装', 1], ['大箱装', 1.85]],
    '份': [['1份', 1], ['3份装', 2.8]]
  };
  const tpl = unitSpecs[cfg.unit] || unitSpecs['份'];
  return [{
    name: '规格',
    values: tpl.map((t, i) => ({
      label: t[0],
      price: round2(cfg.price * t[1]),
      stock: Math.max(5, Math.floor(cfg.stock / (i + 1))),
      pic: img(cfg.imgSeq + i)
    }))
  }];
}

/**
 * 商品构造器
 * cfg: {id,name,catId,catName,price,orig,sells,stock,unit,origin,tags,imgSeq,video,flavors,desc,hot,member}
 */
function g(cfg) {
  const pics = [0, 1, 2, 3, 4].map((k) => img(cfg.imgSeq + k));
  const specs = defaultSpecs(cfg);
  if (cfg.flavors && cfg.flavors.length) {
    specs.push({
      name: '口味',
      values: cfg.flavors.map((f) => ({ label: f }))
    });
  }
  const goods = {
    id: cfg.id,
    name: cfg.name,
    pic: img(cfg.imgSeq),
    pics,
    categoryId: cfg.catId,
    categoryName: cfg.catName,
    minPrice: cfg.price,
    price: cfg.price, // 兼容旧字段
    originalPrice: cfg.orig,
    numberSells: cfg.sells,
    sales: cfg.sells, // 兼容旧字段
    stock: cfg.stock,
    unit: cfg.unit,
    origin: cfg.origin,
    tags: cfg.tags || [],
    specs,
    description: cfg.desc,
    detailImages: [img(cfg.imgSeq + 1), img(cfg.imgSeq + 2), img(cfg.imgSeq + 3)],
    viewCount: 500 + cfg.sells * 3 + cfg.id * 37,
    collectCount: 30 + Math.floor(cfg.sells / 12) + cfg.id * 3,
    isCollect: false,
    hot: !!cfg.hot,
    hotScore: cfg.hot ? 90 + (cfg.id % 10) : 40 + (cfg.id % 30),
    memberPrice: cfg.member ? round2(cfg.price * 0.92) : null
  };
  if (cfg.video) {
    goods.videoUrl = cfg.video;
    goods.videoCover = img(cfg.imgSeq);
    goods.videoIntro = '30 秒带你看完' + cfg.name + '：开箱实拍、细节特写、试吃体验。';
  }
  return goods;
}

const list = [
  // ---------- 1 膨化 ----------
  g({ id: 1, name: '经典原味薯片 酥脆追剧零食', catId: 1, catName: '膨化', price: 6.9, orig: 9.9, sells: 12580, stock: 320, unit: '袋', origin: '广东汕头', tags: ['顺丰包邮', '产地直发'], imgSeq: 1, video: VIDEO_1, flavors: ['原味', '烧烤味', '番茄味'], desc: '精选优质马铃薯，薄切酥脆，一口一片停不下来。追剧、办公、聚会必备零食。', hot: true, member: true }),
  g({ id: 2, name: '黄瓜味薯片 清爽不腻', catId: 1, catName: '膨化', price: 6.9, orig: 9.9, sells: 8960, stock: 260, unit: '袋', origin: '广东汕头', tags: ['产地直发'], imgSeq: 2, flavors: ['黄瓜味', '青柠味'], desc: '清新黄瓜风味，入口清爽不油腻，夏日追剧好搭档。', hot: true }),
  g({ id: 3, name: '鲜虾条 童年味道膨化零食', catId: 1, catName: '膨化', price: 4.5, orig: 6.9, sells: 15230, stock: 500, unit: '袋', origin: '福建晋江', tags: ['坏果包赔', '产地直发'], imgSeq: 3, desc: '真材实料鲜虾制作，香脆可口，满满的童年回忆。' }),
  g({ id: 4, name: '焦糖爆米花 影院同款', catId: 1, catName: '膨化', price: 9.9, orig: 15.9, sells: 6720, stock: 180, unit: '盒', origin: '浙江杭州', tags: ['顺丰包邮'], imgSeq: 4, video: VIDEO_2, flavors: ['焦糖味', '奶油味', '巧克力味'], desc: '现爆玉米粒裹上手工焦糖，颗颗饱满，甜而不腻，在家也能吃出影院感。', member: true }),
  g({ id: 5, name: '麻辣辣条 怀旧零食大礼包', catId: 1, catName: '膨化', price: 8.8, orig: 12.8, sells: 20150, stock: 600, unit: '袋', origin: '湖南平江', tags: ['产地直发', '顺丰包邮'], imgSeq: 5, flavors: ['经典麻辣', '香辣味', '甜辣味'], desc: '平江正宗辣条，麻辣鲜香，一口回到学生时代。', hot: true, member: true }),

  // ---------- 2 糖果 ----------
  g({ id: 6, name: '水果棒棒糖 混合口味', catId: 2, catName: '糖果', price: 7.9, orig: 11.9, sells: 9340, stock: 420, unit: '盒', origin: '广东潮州', tags: ['产地直发'], imgSeq: 6, flavors: ['草莓味', '橙子味', '葡萄味', '可乐味'], desc: '十种水果口味混合装，果汁含量高，孩子的最爱。' }),
  g({ id: 7, name: 'QQ果汁软糖 酸甜Q弹', catId: 2, catName: '糖果', price: 5.9, orig: 8.9, sells: 11270, stock: 380, unit: '袋', origin: '广东潮州', tags: ['坏果包赔'], imgSeq: 7, flavors: ['混合水果', '芒果味', '荔枝味'], desc: '真果汁熬制，Q弹有嚼劲，酸甜适中不粘牙。', hot: true }),
  g({ id: 8, name: '特浓牛奶糖 奶香浓郁', catId: 2, catName: '糖果', price: 10.9, orig: 14.9, sells: 7650, stock: 240, unit: '袋', origin: '内蒙古呼和浩特', tags: ['顺丰包邮', '产地直发'], imgSeq: 8, desc: '优质生牛乳熬煮，奶香浓郁，入口即化。', member: true }),
  g({ id: 9, name: '维生素C硬糖 柠檬味', catId: 2, catName: '糖果', price: 4.9, orig: 7.5, sells: 5430, stock: 300, unit: '瓶', origin: '江苏苏州', tags: [], imgSeq: 9, flavors: ['柠檬味', '香橙味'], desc: '每颗含维生素C，酸甜开胃，办公室提神小零食。' }),

  // ---------- 3 坚果 ----------
  g({ id: 10, name: '每日坚果混合装 30包', catId: 3, catName: '坚果', price: 59.9, orig: 89.9, sells: 18760, stock: 400, unit: '盒', origin: '山东青岛', tags: ['顺丰包邮', '产地直发', '当季现摘'], imgSeq: 10, video: VIDEO_1, desc: '六种坚果果干科学配比，独立小包装，每天一包营养均衡。', hot: true, member: true }),
  g({ id: 11, name: '琥珀核桃仁 焦糖味', catId: 3, catName: '坚果', price: 19.9, orig: 29.9, sells: 6890, stock: 150, unit: '罐', origin: '云南大理', tags: ['当季现摘', '产地直发'], imgSeq: 11, desc: '新疆纸皮核桃手工去壳，低温油炸挂糖，酥脆香甜不返苦。' }),
  g({ id: 12, name: '夏威夷果 奶油味开口', catId: 3, catName: '坚果', price: 24.9, orig: 36.9, sells: 8320, stock: 200, unit: '袋', origin: '云南普洱', tags: ['产地直发', '坏果包赔'], imgSeq: 12, video: VIDEO_2, flavors: ['奶油味', '原味'], desc: '大开口设计附赠开壳器，果仁饱满奶香浓郁。', hot: true, member: true }),
  g({ id: 13, name: '纸皮核桃 新疆原味', catId: 3, catName: '坚果', price: 16.8, orig: 24.8, sells: 9980, stock: 260, unit: '斤', origin: '新疆阿克苏', tags: ['当季现摘', '产地直发', '坏果包赔'], imgSeq: 13, desc: '阿克苏冰雪融水灌溉，壳薄如纸，手捏即开，果仁醇香。' }),
  g({ id: 14, name: '开心果 盐焗无漂白', catId: 3, catName: '坚果', price: 29.9, orig: 42.9, sells: 5240, stock: 120, unit: '罐', origin: '山东青岛', tags: ['顺丰包邮'], imgSeq: 14, desc: '自然开口无漂白，盐焗工艺，颗粒大果仁绿。', member: true }),

  // ---------- 4 饼干 ----------
  g({ id: 15, name: '手工曲奇饼干 黄油味', catId: 4, catName: '饼干', price: 15.9, orig: 23.9, sells: 10450, stock: 280, unit: '盒', origin: '广东东莞', tags: ['顺丰包邮', '产地直发'], imgSeq: 15, video: VIDEO_1, flavors: ['黄油味', '抹茶味', '巧克力味'], desc: '进口黄油手工制作，酥松掉渣，四种口味一次满足。', hot: true, member: true }),
  g({ id: 16, name: '苏打饼干 咸香梳打', catId: 4, catName: '饼干', price: 6.5, orig: 9.9, sells: 7830, stock: 450, unit: '袋', origin: '福建泉州', tags: [], imgSeq: 16, flavors: ['原味', '奶盐味', '葱香味'], desc: '层层起酥咸香可口，饿了来两片，垫胃不负担。' }),
  g({ id: 17, name: '黄油曲奇礼盒 丹麦风味', catId: 4, catName: '饼干', price: 39.9, orig: 59.9, sells: 4560, stock: 100, unit: '箱', origin: '江苏南京', tags: ['顺丰包邮'], imgSeq: 17, desc: '丹麦风味黄油曲奇，铁盒包装，自享送礼两相宜。' }),
  g({ id: 18, name: '夹心饼干 巧克力味', catId: 4, catName: '饼干', price: 5.5, orig: 8.5, sells: 13260, stock: 520, unit: '袋', origin: '广东汕头', tags: ['产地直发'], imgSeq: 18, flavors: ['巧克力味', '草莓味', '香草味'], desc: '酥脆饼干夹浓郁巧克力夹心，扭一扭舔一舔。', hot: true }),

  // ---------- 5 肉脯 ----------
  g({ id: 19, name: '靖江猪肉脯 原味蜜汁', catId: 5, catName: '肉脯', price: 18.9, orig: 26.9, sells: 16540, stock: 350, unit: '袋', origin: '江苏靖江', tags: ['产地直发', '顺丰包邮'], imgSeq: 1, video: VIDEO_2, flavors: ['原味', '蜜汁味', '香辣味'], desc: '精选猪后腿肉，炭火慢烤，薄如纸片，肉香浓郁。', hot: true, member: true }),
  g({ id: 20, name: '手撕牛肉干 风干原味', catId: 5, catName: '肉脯', price: 32.9, orig: 46.9, sells: 8760, stock: 180, unit: '袋', origin: '内蒙古呼和浩特', tags: ['产地直发', '坏果包赔'], imgSeq: 2, flavors: ['原味', '五香味', '麻辣味'], desc: '草原黄牛肉自然风干，手撕成条，越嚼越香。', member: true }),
  g({ id: 21, name: '卤味鸭脖 麻辣即食', catId: 5, catName: '肉脯', price: 14.9, orig: 21.9, sells: 19320, stock: 400, unit: '盒', origin: '湖北武汉', tags: ['产地直发'], imgSeq: 3, flavors: ['麻辣味', '甜辣味', '五香味'], desc: '武汉正宗卤味，三十余味香料老卤熬制，辣得过瘾。', hot: true }),
  g({ id: 22, name: '烤鸡肉条 低脂即食', catId: 5, catName: '肉脯', price: 12.9, orig: 18.9, sells: 6540, stock: 240, unit: '袋', origin: '山东德州', tags: ['顺丰包邮'], imgSeq: 4, flavors: ['原味', '黑椒味'], desc: '鸡胸肉低温烤制，高蛋白低脂肪，健身解馋两不误。' }),

  // ---------- 6 饮料 ----------
  g({ id: 23, name: '白桃气泡水 无糖0脂', catId: 6, catName: '饮料', price: 3.9, orig: 5.9, sells: 22340, stock: 800, unit: '瓶', origin: '广东广州', tags: ['产地直发'], imgSeq: 5, video: VIDEO_1, flavors: ['白桃味', '柠檬味', '葡萄味'], desc: '0糖0脂0卡，气泡绵密，白桃清香，冰镇更佳。', hot: true }),
  g({ id: 24, name: 'NFC鲜榨橙汁 100%果汁', catId: 6, catName: '饮料', price: 9.9, orig: 14.9, sells: 9870, stock: 300, unit: '瓶', origin: '江西赣州', tags: ['当季现摘', '产地直发'], imgSeq: 6, desc: '赣南脐橙鲜榨，非浓缩还原，冷藏锁鲜直达。', member: true }),
  g({ id: 25, name: '常温酸奶 原味整箱', catId: 6, catName: '饮料', price: 29.9, orig: 45.9, sells: 11230, stock: 260, unit: '箱', origin: '内蒙古呼和浩特', tags: ['顺丰包邮'], imgSeq: 7, flavors: ['原味', '草莓味', '黄桃味'], desc: '优质奶源发酵，口感顺滑，整箱囤货更划算。', hot: true, member: true }),
  g({ id: 26, name: '冰红茶 柠檬味', catId: 6, catName: '饮料', price: 3.5, orig: 5.0, sells: 15670, stock: 700, unit: '瓶', origin: '浙江杭州', tags: [], imgSeq: 8, desc: '经典柠檬红茶，冰爽解腻，火锅烧烤好搭档。' }),

  // ---------- 7 礼盒 ----------
  g({ id: 27, name: '坚果零食大礼包 节日送礼', catId: 7, catName: '礼盒', price: 88.0, orig: 128.0, sells: 4320, stock: 90, unit: '箱', origin: '山东青岛', tags: ['顺丰包邮', '产地直发'], imgSeq: 9, video: VIDEO_2, desc: '十种坚果零食组合，大气礼盒包装，节日送礼有面子。', hot: true, member: true }),
  g({ id: 28, name: '零食巨型大礼包 28件装', catId: 7, catName: '礼盒', price: 69.9, orig: 99.9, sells: 7650, stock: 120, unit: '箱', origin: '江苏苏州', tags: ['顺丰包邮'], imgSeq: 10, desc: '28 件网红零食一箱打尽，生日礼物、节日惊喜首选。', hot: true }),
  g({ id: 29, name: '地方特产礼盒 伴手礼', catId: 7, catName: '礼盒', price: 108.0, orig: 158.0, sells: 2340, stock: 60, unit: '箱', origin: '云南昆明', tags: ['产地直发', '当季现摘'], imgSeq: 11, desc: '汇集各地名优特产，一盒尝遍中国味道。', member: true }),

  // ---------- 8 进口 ----------
  g({ id: 30, name: '比利时黑巧克力 72%可可', catId: 8, catName: '进口', price: 25.9, orig: 39.9, sells: 6780, stock: 150, unit: '盒', origin: '比利时（进口）', tags: ['顺丰包邮'], imgSeq: 12, flavors: ['72%黑巧', '牛奶巧克力', '榛子味'], desc: '比利时原装进口，可可含量72%，醇苦回甘。', member: true }),
  g({ id: 31, name: '泰国芒果干 无添加', catId: 8, catName: '进口', price: 13.9, orig: 19.9, sells: 10230, stock: 320, unit: '袋', origin: '泰国（进口）', tags: ['产地直发', '坏果包赔'], imgSeq: 13, video: VIDEO_1, desc: '泰国金枕头芒果低温烘干，无添加蔗糖，果香浓郁。', hot: true }),
  g({ id: 32, name: '日本海苔脆片 即食', catId: 8, catName: '进口', price: 11.9, orig: 16.9, sells: 8450, stock: 260, unit: '袋', origin: '日本（进口）', tags: [], imgSeq: 14, flavors: ['原味', '芥末味', '酱油味'], desc: '日本有明海产海苔，轻烘焙锁鲜，薄脆咸香。' }),
  g({ id: 33, name: '韩国蜂蜜黄油腰果', catId: 8, catName: '进口', price: 27.9, orig: 39.9, sells: 5430, stock: 140, unit: '罐', origin: '韩国（进口）', tags: ['顺丰包邮'], imgSeq: 15, desc: '蜂蜜黄油包裹大颗腰果，甜咸交织，追剧神器。', member: true })
];

// 轮播图（复用本地生成图）
const banners = [
  { id: 1, name: '零食大促销', pic: '/static/mock/banner-1.png', description: '全场零食8折起 · 满59免配送费', linkGoodsId: 27 },
  { id: 2, name: '新品上市', pic: '/static/mock/banner-2.png', description: '每日坚果新装上市 · 产地直发', linkGoodsId: 10 },
  { id: 3, name: '会员专享', pic: '/static/mock/banner-3.png', description: '会员日积分翻倍 · 专享92折', linkGoodsId: 15 }
];

// 首页主题区
const themes = [
  {
    id: 1,
    name: '热门爆款',
    description: '本周万人加购的零食 TOP 榜',
    topic_img: '/static/mock/theme-1.png',
    products: [1, 5, 10, 19, 23, 27]
  },
  {
    id: 2,
    name: '新品尝鲜',
    description: '新品首发 · 尝鲜价直降',
    topic_img: '/static/mock/theme-2.png',
    products: [4, 12, 22, 30, 33]
  },
  {
    id: 3,
    name: '特惠专区',
    description: '限时折扣 · 囤货好时机',
    topic_img: '/static/mock/theme-3.png',
    products: [3, 7, 16, 21, 26, 28]
  }
];

module.exports = { list, banners, themes, VIDEO_1, VIDEO_2 };
