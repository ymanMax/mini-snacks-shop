// mock/data/goods.js —— 32 款商品，覆盖 8 个分类
// 金额统一为数字（元，两位小数），图片全部为本地静态资源

const r2 = (n) => Math.round(n * 100) / 100
const pad = (n) => (n < 10 ? '0' + n : '' + n)
const G = (id) => '/static/mock/goods/g' + pad(id) + '.jpg'
const D = (id) => '/static/mock/detail/d' + pad(id) + '.jpg'

// 分类维度配置：产地池、口味、标签
const CAT_CONF = {
  1: {
    origins: ['广东江门', '山东临沂', '上海'],
    flavors: ['原味', '香辣味', '烧烤味'],
    tags: ['0反式脂肪酸', '独立小包', '网红同款'],
    desc: '甄选优质马铃薯，非油炸工艺烘焙成型，口感酥脆、咸香适中，追剧聚会必备的膨化小食，封口包装防潮保鲜。'
  },
  2: {
    origins: ['江苏苏州', '广东东莞', '福建泉州'],
    flavors: ['原味', '抹茶味', '草莓味'],
    tags: ['丝滑口感', '甜蜜治愈', '节日限定'],
    desc: '进口可可原料，恒温慢磨工艺，入口丝滑浓郁；软糖果汁含量高，Q 弹有嚼劲，甜而不腻。'
  },
  3: {
    origins: ['浙江临安', '新疆阿克苏', '云南昆明'],
    flavors: ['奶油味', '盐焗味', '原味'],
    tags: ['产地直发', '颗颗饱满', '每日一袋'],
    desc: '当季新果，颗粒饱满酥脆，低温烘焙锁住原香，富含优质蛋白与膳食纤维，每日一小把元气满满。'
  },
  4: {
    origins: ['广东东莞', '山东青岛', '上海'],
    flavors: ['蔓越莓味', '咸蛋黄味', '原味'],
    tags: ['新鲜日期', '早餐代餐', '独立小包'],
    desc: '新西兰进口黄油烘焙，奶香浓郁、层层酥脆，不添加防腐剂，是早餐与下午茶的好搭档。'
  },
  5: {
    origins: ['江苏靖江', '四川成都', '湖南长沙'],
    flavors: ['香辣味', '五香味', '麻辣味'],
    tags: ['顺丰包邮', '老卤慢炖', '高蛋白'],
    desc: '整块原切后腿肉，老汤慢卤入味，纹理清晰、嚼劲十足，肉香浓郁，是佐酒下饭的人气选择。'
  },
  6: {
    origins: ['浙江杭州', '云南普洱', '广东广州'],
    flavors: ['原味', '白桃味', '桂花味'],
    tags: ['低糖配方', '清爽解腻', '当日发货'],
    desc: '真材实料现摇现装，茶香醇厚、奶香自然；气泡水 0 糖 0 脂 0 卡，冰镇后口感更佳。'
  },
  7: {
    origins: ['上海', '浙江杭州'],
    flavors: ['混合口味', '经典优选', '豪华甄选'],
    tags: ['礼盒精选', '送礼有面', '顺丰包邮'],
    desc: '一盒集齐店铺招牌零食，精选搭配不重样，烫金礼盒包装，走亲访友、公司福利的心意之选。'
  },
  8: {
    origins: ['韩国首尔', '日本北海道', '泰国曼谷'],
    flavors: ['黄油味', '牛奶味', '芒果味'],
    tags: ['进口正品', '海关检疫', '海外直采'],
    desc: '海外原产地直采，正规报关、海关检疫齐全，还原当地经典风味，不出国门吃遍世界零食。'
  }
}

// [id, 名称, 分类, 现价, 原价, 销量, 库存, 单位]
const RAW = [
  [1, '香辣味薯片', 1, 6.90, 9.90, 3286, 200, '袋'],
  [2, '原味马铃薯片', 1, 5.90, 8.50, 2451, 320, '袋'],
  [3, '墨西哥玉米片', 1, 9.90, 13.80, 1876, 150, '袋'],
  [4, '芝士玉米棒', 1, 4.50, 6.50, 4203, 0, '袋'],
  [5, '丝滑牛奶巧克力', 2, 15.90, 22.00, 2890, 180, '盒'],
  [6, '松露形黑巧克力', 2, 19.90, 29.90, 1567, 96, '盒'],
  [7, '果汁QQ软糖', 2, 7.90, 11.90, 3560, 400, '袋'],
  [8, '海盐薄荷糖', 2, 3.90, 5.50, 5210, 0, '袋'],
  [9, '奶油夏威夷果', 3, 29.90, 39.90, 2103, 120, '罐'],
  [10, '每日坚果混合装', 3, 39.90, 59.00, 4680, 260, '盒'],
  [11, '手剥巴旦木', 3, 18.80, 25.80, 1980, 180, '袋'],
  [12, '焦糖味瓜子', 3, 8.80, 12.80, 6032, 500, '袋'],
  [13, '蔓越莓曲奇饼干', 4, 12.90, 18.00, 2760, 220, '盒'],
  [14, '咸蛋黄麦芽饼', 4, 9.90, 14.50, 3420, 300, '袋'],
  [15, '手撕软面包', 4, 6.50, 9.90, 1890, 260, '袋'],
  [16, '流心榴莲饼', 4, 13.90, 19.90, 1240, 140, '盒'],
  [17, '靖江精制猪肉脯', 5, 16.90, 24.80, 3985, 190, '袋'],
  [18, '麻辣手撕牛肉干', 5, 26.90, 39.90, 2210, 110, '袋'],
  [19, '虎皮五香凤爪', 5, 14.90, 20.00, 2870, 170, '袋'],
  [20, '卤味鸭脖大礼包', 5, 22.90, 32.90, 1680, 80, '盒'],
  [21, '手摇珍珠奶茶', 6, 8.80, 12.00, 4530, 240, '杯'],
  [22, '冷萃冻干咖啡', 6, 24.90, 36.00, 1960, 150, '盒'],
  [23, '白桃味气泡水', 6, 4.90, 7.00, 7820, 600, '瓶'],
  [24, '桂花酸梅汤', 6, 5.90, 8.50, 2340, 320, '瓶'],
  [25, '进口零食大礼盒', 7, 88.00, 128.00, 986, 60, '箱'],
  [26, '坚果年货礼盒', 7, 69.90, 99.00, 1540, 90, '箱'],
  [27, '童心糖果礼盒', 7, 39.90, 59.00, 1320, 110, '盒'],
  [28, '辣条欢聚大礼包', 7, 29.90, 45.00, 3670, 200, '袋'],
  [29, '蜂蜜黄油杏仁', 8, 21.90, 32.00, 1760, 130, '袋'],
  [30, '白色恋人饼干', 8, 45.00, 68.00, 890, 70, '盒'],
  [31, '泰国芒果软糖', 8, 12.90, 18.80, 2640, 260, '袋'],
  [32, '德式咸脆饼干棒', 8, 11.90, 16.80, 1450, 180, '盒']
]

const VIDEO_IDS = {
  1: '/static/mock/video/v1.mp4',
  9: '/static/mock/video/v1.mp4',
  17: '/static/mock/video/v1.mp4',
  21: '/static/mock/video/v1.mp4',
  5: '/static/mock/video/v2.mp4',
  13: '/static/mock/video/v2.mp4',
  25: '/static/mock/video/v2.mp4',
  29: '/static/mock/video/v2.mp4'
}

function pickOthers(id, count) {
  const arr = []
  let n = id
  for (let i = 0; i < count; i++) {
    n = (n + 6 + i * 5) % 32 + 1
    while (n === id || arr.indexOf(n) > -1) n = (n % 32) + 1
    arr.push(n)
  }
  return arr
}

function buildGoods(row) {
  const id = row[0]
  const name = row[1]
  const catId = row[2]
  const price = row[3]
  const originalPrice = row[4]
  const sales = row[5]
  const stock = row[6]
  const unit = row[7]
  const conf = CAT_CONF[catId]
  const main = G(id)
  const others = pickOthers(id, 3)
  const pics = [main].concat(others.map(G))
  const shareStock = Math.max(stock, 50)
  const goods = {
    id: id,
    name: name,
    pic: main,
    pics: pics,
    videoUrl: VIDEO_IDS[id] || '',
    videoCover: main,
    categoryId: catId,
    categoryName: '',
    minPrice: price,
    price: price,
    originalPrice: originalPrice,
    memberPrice: r2(price * 0.97),
    numberSells: sales,
    sales: sales,
    stock: stock,
    unit: unit,
    origin: conf.origins[id % conf.origins.length],
    tags: [
      conf.tags[id % conf.tags.length],
      conf.tags[(id + 1) % conf.tags.length],
      id % 4 === 0 ? '第二件半价' : '顺丰包邮'
    ],
    specs: [
      {
        name: '规格',
        values: [
          { label: '尝鲜装x1', price: price, stock: stock, pic: main },
          { label: '分享装x2', price: r2(price * 1.9), stock: shareStock, pic: G(others[0]) },
          { label: '整箱装x4', price: r2(price * 3.6), stock: Math.max(30, Math.floor(stock / 3)), pic: G(others[1]) }
        ]
      },
      {
        name: '口味',
        values: conf.flavors.map(function (f) { return { label: f } })
      }
    ],
    description: conf.desc,
    detailImages: [D(1), D(2), D(3), D(4)],
    videoIntro: '店主实拍：开箱展示与试吃全过程，所见即所得。',
    viewCount: sales * 12 + id * 137,
    collectCount: Math.floor(sales / 28) + id * 9,
    isCollect: false,
    // 团购批发阶梯：discount 为折扣（95 = 9.5 折）
    wholesaleLadder: [
      { count: 2, discount: 95, label: '2 件 9.5 折' },
      { count: 5, discount: 88, label: '5 件 8.8 折' },
      { count: 10, discount: 80, label: '10 件 8 折' }
    ],
    hot: sales >= 3000,
    hotScore: sales + Math.floor(sales * id / 40),
    reviewCount: 0,
    avgScore: 5
  }
  return goods
}

const goodsList = RAW.map(buildGoods)

// 按 id 取图（评价晒图等复用）
function goodsPic(id) {
  return G(id)
}

module.exports = {
  goodsList: goodsList,
  goodsPic: goodsPic,
  G: G,
  D: D,
  CAT_CONF: CAT_CONF
}
