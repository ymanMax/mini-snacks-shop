/**
 * 签到 Mock 数据（字段与 4.9 checkin 对齐）
 * rewards：7 天一循环，连签第 7 天大奖 +50
 */
const { fmt } = require('../_time.js');

const rewards = [5, 5, 10, 10, 15, 20, 50];

/**
 * 初始状态：本月 1 号起已连续签到 3 天（若今天 <= 3 号则按实际天数）
 * monthRecords 为当月已签到的"日"数组；todaySigned 在 mock/index.js 中动态判断
 */
function buildInitialCheckin() {
  const today = new Date().getDate();
  const signedDays = [];
  const n = Math.min(3, today - 1); // 今天之前连续签到的天数（今天尚未签）
  for (let i = 0; i < n; i++) {
    signedDays.push(today - n + i);
  }
  return {
    continuousDays: signedDays.length,
    todaySigned: false,
    monthRecords: signedDays,
    month: fmt(0, 'YYYY-MM').slice(0, 7),
    rewards,
    totalPoints: 680
  };
}

const rules = [
  '每日签到可得积分奖励，连续签到奖励升级；',
  '7 天一循环：第1~2天 +5，第3~4天 +10，第5天 +15，第6天 +20，第7天大奖 +50；',
  '断签后从第 1 天重新计算；',
  '签到积分实时到账，可在积分中心查看明细。'
];

module.exports = { buildInitialCheckin, rewards, rules };
