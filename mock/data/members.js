// mock/data/members.js —— 会员等级、成长值、特权
const levels = [
  {
    level: 1,
    name: '普通会员',
    minGrowth: 0,
    discount: 100, // 无折扣（100 = 原价）
    freeFreightThreshold: 59,
    monthlyCoupons: 0,
    privileges: ['新人专享礼包', '满 59 元免配送费', '每日签到领积分']
  },
  {
    level: 2,
    name: '银卡会员',
    minGrowth: 500,
    discount: 98, // 98 折
    freeFreightThreshold: 59,
    monthlyCoupons: 1,
    privileges: ['全场 98 折', '满 59 元免配送费', '每月赠券 1 张', '生日双倍积分']
  },
  {
    level: 3,
    name: '金卡会员',
    minGrowth: 1000,
    discount: 95, // 95 折
    freeFreightThreshold: 49,
    monthlyCoupons: 1,
    privileges: ['全场 95 折', '满 49 元免配送费', '生日礼包升级', '每月赠券 1 张', '专属会员价商品']
  },
  {
    level: 4,
    name: '铂金会员',
    minGrowth: 3000,
    discount: 93,
    freeFreightThreshold: 39,
    monthlyCoupons: 2,
    privileges: ['全场 93 折', '满 39 元免配送费', '优先配送', '每月赠券 2 张', '生日礼包升级']
  },
  {
    level: 5,
    name: '钻石会员',
    minGrowth: 10000,
    discount: 92,
    freeFreightThreshold: 39,
    monthlyCoupons: 3,
    privileges: ['全场 92 折', '满 39 元免配送费', '专属客服通道', '每月赠券 3 张', '优先配送', '生日豪华礼包']
  }
];

// 成长值规则说明
const growthRules = [
  { action: '每日签到', growth: '+5' },
  { action: '每消费 1 元', growth: '+1' },
  { action: '完成商品评价', growth: '+10' },
  { action: '完成订单支付', growth: '+20' }
];

function getLevelByGrowth(growth) {
  let cur = levels[0];
  levels.forEach((lv) => {
    if (growth >= lv.minGrowth) cur = lv;
  });
  return cur;
}

function getNextLevel(level) {
  return levels[level] || null;
}

module.exports = { levels, growthRules, getLevelByGrowth, getNextLevel };
