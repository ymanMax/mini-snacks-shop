// mock/data/members.js —— 会员等级与特权
const levels = [
  {
    level: 1,
    name: '普通会员',
    minGrowth: 0,
    discount: 98, // 98 折
    freeThreshold: 59, // 免基础配送费门槛
    privileges: ['新人专享礼包', '购物赠积分', '满 59 免配送费']
  },
  {
    level: 2,
    name: '银卡会员',
    minGrowth: 1000,
    discount: 97,
    freeThreshold: 59,
    privileges: ['97 折会员价', '生日小礼包', '满 59 免配送费', '每月 1 张优惠券']
  },
  {
    level: 3,
    name: '金卡会员',
    minGrowth: 3000,
    discount: 95,
    freeThreshold: 49,
    privileges: ['95 折会员价', '生日升级礼包', '满 49 免配送费', '优先配送', '每月 2 张优惠券']
  },
  {
    level: 4,
    name: '铂金会员',
    minGrowth: 8000,
    discount: 93,
    freeThreshold: 39,
    privileges: ['93 折会员价', '生日豪华礼包', '满 39 免配送费', '专属客服', '每月 3 张优惠券']
  },
  {
    level: 5,
    name: '钻石会员',
    minGrowth: 20000,
    discount: 92,
    freeThreshold: 39,
    privileges: ['92 折尊享价', '生日至尊礼包', '全场免配送费', '专属客服', '优先发货', '每月 5 张优惠券']
  }
]

// 生日礼包（按等级升级内容）
const birthdayGifts = [
  { level: 1, points: 100, couponId: 4, title: '新人礼包：100 积分 + 5 元无门槛券' },
  { level: 2, points: 200, couponId: 4, title: '银卡礼包：200 积分 + 5 元无门槛券' },
  { level: 3, points: 500, couponId: 1, title: '金卡礼包：500 积分 + 满 59 减 8 券' },
  { level: 4, points: 800, couponId: 2, title: '铂金礼包：800 积分 + 满 99 减 20 券' },
  { level: 5, points: 1200, couponId: 3, title: '钻石礼包：1200 积分 + 满 199 减 50 券' }
]

module.exports = { levels: levels, birthdayGifts: birthdayGifts }
