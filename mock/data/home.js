// mock/data/home.js —— 首页轮播图与精选主题
const banners = [
  {
    id: 1,
    name: '零食大促销',
    pic: '/static/mock/banner1.jpg',
    img: { url: '/static/mock/banner1.jpg' },
    description: '全场满 99 减 20，限时 3 天',
    linkType: 'page',
    linkUrl: '/pages/promotion/index'
  },
  {
    id: 2,
    name: '新品抢先尝',
    pic: '/static/mock/banner2.jpg',
    img: { url: '/static/mock/banner2.jpg' },
    description: '当季网红零食新鲜上架',
    linkType: 'page',
    linkUrl: '/pages/classic/classic'
  },
  {
    id: 3,
    name: '会员专享日',
    pic: '/static/mock/banner3.jpg',
    img: { url: '/static/mock/banner3.jpg' },
    description: '金卡会员享专属折扣与每月赠券',
    linkType: 'page',
    linkUrl: '/pages/member/center/center'
  }
];

const themes = [
  {
    id: 1,
    name: '热门零食',
    description: '最受欢迎的零食推荐',
    topicImg: '/static/mock/theme1.jpg',
    topic_img: { url: '/static/mock/theme1.jpg' },
    productIds: [12, 9, 13, 29, 21, 18, 3, 25]
  },
  {
    id: 2,
    name: '新品上市',
    description: '最新上市的网红零食',
    topicImg: '/static/mock/theme2.jpg',
    topic_img: { url: '/static/mock/theme2.jpg' },
    productIds: [24, 23, 31, 11, 2, 30]
  },
  {
    id: 3,
    name: '特惠专区',
    description: '高性价比之选',
    topicImg: '/static/mock/theme3.jpg',
    topic_img: { url: '/static/mock/theme3.jpg' },
    productIds: [32, 7, 10, 16, 20, 27]
  }
];

// 首页金刚区（快捷入口）
const quickEntries = [
  { id: 1, name: '限时抢购', color: '#B4282D', icon: 'seckill', url: '/pages/promotion/index' },
  { id: 2, name: '拼团优惠', color: '#F6A623', icon: 'group', url: '/pages/group/index' },
  { id: 3, name: '领券中心', color: '#D96B8E', icon: 'coupon', url: '/pages/coupon/center/center' },
  { id: 4, name: '每日签到', color: '#2FA892', icon: 'checkin', url: '/pages/member/checkin/checkin' },
  { id: 5, name: '会员中心', color: '#8E5BA6', icon: 'member', url: '/pages/member/center/center' },
  { id: 6, name: '积分兑换', color: '#4A90D9', icon: 'points', url: '/pages/member/points/points' },
  { id: 7, name: '进口零食', color: '#2FA892', icon: 'import', url: '/pages/list/list?category=8' },
  { id: 8, name: '全部分类', color: '#8A8F99', icon: 'category', url: '/pages/classic/classic' }
];

const hotKeywords = ['薯片', '每日坚果', '火鸡面', '巧克力', '鸭脖', '气泡水', '礼盒', '海苔'];

module.exports = { banners, themes, quickEntries, hotKeywords };
