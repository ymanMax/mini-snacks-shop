/**
 * 会员体系 Mock 数据（字段与 4.7 member 对齐）
 * 等级：1普通 / 2银卡 / 3金卡 / 4铂金 / 5钻石，特权按等级递进
 */
const levels = [
  {
    level: 1, levelName: '普通会员', growth: 0, icon: '🥉',
    discount: 1.0, discountText: '无折扣',
    freeShipThreshold: 59,
    privileges: ['基础购物权益', '生日礼包（5元无门槛券）']
  },
  {
    level: 2, levelName: '银卡会员', growth: 500, icon: '🥈',
    discount: 0.98, discountText: '专属98折',
    freeShipThreshold: 59,
    privileges: ['专属98折', '生日礼包升级（10元券+50积分）', '每月赠券 1 张']
  },
  {
    level: 3, levelName: '金卡会员', growth: 1000, icon: '🥇',
    discount: 0.96, discountText: '专属96折',
    freeShipThreshold: 49,
    privileges: ['专属96折', '免配送费门槛降至49元', '优先配送', '生日礼包升级（20元券+100积分）', '每月赠券 2 张']
  },
  {
    level: 4, levelName: '铂金会员', growth: 2000, icon: '💎',
    discount: 0.94, discountText: '专属94折',
    freeShipThreshold: 39,
    privileges: ['专属94折', '免配送费门槛降至39元', '优先配送', '专属客服', '生日礼包升级（30元券+200积分）', '每月赠券 3 张']
  },
  {
    level: 5, levelName: '钻石会员', growth: 4000, icon: '👑',
    discount: 0.92, discountText: '专属92折',
    freeShipThreshold: 39,
    privileges: ['专属92折', '免配送费门槛降至39元', '优先配送', '专属客服', '生日礼包豪华版（50元券+500积分）', '每月赠券 4 张', '新品免费试吃']
  }
];

/** 当前用户会员状态（内存初始值，运行期以 store 为准） */
const member = {
  userId: 10001,
  level: 3,
  levelName: '金卡会员',
  growthValue: 1250,
  nextLevelGrowth: 2000,
  points: 680,
  validDate: '2027-08-08',
  privileges: levels[2].privileges
};

function getLevelConf(level) {
  return levels.find((l) => l.level === Number(level)) || levels[0];
}

module.exports = { levels, member, getLevelConf };
