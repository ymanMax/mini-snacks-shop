// mock/data/checkin.js —— 签到规则（7 天一循环）
const checkinRewards = [5, 5, 10, 10, 15, 20, 50];

const checkinRules = [
  '每日签到可领取对应积分，连续签到奖励递增',
  '以 7 天为一个循环，第 7 天可领 50 积分大奖',
  '中途断签将重新从第 1 天开始计算',
  '签到积分实时到账，可在「我的积分」中查看明细'
];

module.exports = { checkinRewards, checkinRules };
