// mock/data/checkin.js —— 签到规则（7 天一循环）
const checkinRule = {
  // 连签第 1~7 天奖励
  rewards: [
    { day: 1, points: 5, label: '+5' },
    { day: 2, points: 5, label: '+5' },
    { day: 3, points: 10, label: '+10' },
    { day: 4, points: 10, label: '+10' },
    { day: 5, points: 15, label: '+15' },
    { day: 6, points: 20, label: '+20' },
    { day: 7, points: 50, label: '+50' }
  ],
  rules: [
    '每日签到可领取对应积分，连续签到奖励递增；',
    '连续签到第 7 天可领取 50 积分大奖，奖励 7 天循环；',
    '中断签到后连续天数重新计算，请坚持每日打卡；',
    '签到积分实时到账，可在「我的积分」中查看明细。'
  ]
}

module.exports = checkinRule
