// mock/data/members.js —— 会员等级体系
// level: 1普通 2银卡 3金卡 4铂金 5钻石
module.exports = {
  levels: [
    { level: 1, levelName: '普通会员', growth: 0, discount: 1.0, discountText: '无折扣', freeDeliveryThreshold: 59, privileges: ['生日小礼包', '积分累计'] },
    { level: 2, levelName: '银卡会员', growth: 500, discount: 0.98, discountText: '98 折', freeDeliveryThreshold: 59, privileges: ['专属 98 折', '生日礼包', '积分累计', '每月赠券 1 张'] },
    { level: 3, levelName: '金卡会员', growth: 1000, discount: 0.95, discountText: '95 折', freeDeliveryThreshold: 49, privileges: ['专属 95 折', '生日豪华礼包', '满 49 免配送费', '每月赠券 2 张'] },
    { level: 4, levelName: '铂金会员', growth: 3000, discount: 0.93, discountText: '93 折', freeDeliveryThreshold: 39, privileges: ['专属 93 折', '生日奢华礼包', '满 39 免配送费', '优先配送', '每月赠券 3 张'] },
    { level: 5, levelName: '钻石会员', growth: 8000, discount: 0.92, discountText: '92 折', freeDeliveryThreshold: 0, privileges: ['专属 92 折', '生日至尊礼包', '全场免配送费', '优先配送', '专属客服', '每月赠券 5 张'] }
  ]
};
