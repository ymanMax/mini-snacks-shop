// pages/member/checkin/checkin.js —— 签到日历 + 连续 7 天奖励梯度
const { checkinApi, memberApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    info: null,
    cells: [],
    rewardItems: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    points: 0,
    animReward: 0,
    showAnim: false
  },

  onShow() {
    this.load();
  },

  load() {
    checkinApi.getInfo().then((info) => {
      this.setData({ info, cells: this.buildCells(info), rewardItems: this.buildRewards(info) });
    });
    memberApi.getInfo().then((m) => this.setData({ points: m.user.points })).catch(() => {});
  },

  // 7 天奖励条状态：done（本轮已领）/ cur（下一次）/ future
  buildRewards(info) {
    let cyclePos = info.continuousDays % 7; // 0 且已签到 => 刚完成一轮
    if (info.todaySigned && info.continuousDays % 7 === 0) cyclePos = 7;
    return info.rewards.map((reward, i) => {
      let state = 'future';
      if (i + 1 <= cyclePos) state = 'done';
      if (i + 1 === cyclePos + 1 && !info.todaySigned) state = 'cur';
      if (info.todaySigned && i + 1 === 1 && cyclePos === 7) state = 'cur';
      return { reward, day: i + 1, state, big: i === 6 };
    });
  },

  buildCells(info) {
    const firstDay = new Date(info.year, info.month - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push({ empty: true, key: 'e' + i });
    for (let d = 1; d <= info.daysInMonth; d++) {
      cells.push({
        key: 'd' + d,
        day: d,
        signed: info.monthRecords.indexOf(d) !== -1,
        today: d === info.today,
        future: d > info.today
      });
    }
    return cells;
  },

  doSign() {
    if (this.data.info.todaySigned) {
      toast.showToast('今日已签到，明天再来吧');
      return;
    }
    checkinApi.sign().then((res) => {
      // 积分动画
      this.setData({
        animReward: res.reward,
        showAnim: true,
        points: res.points
      });
      setTimeout(() => this.setData({ showAnim: false }), 1600);
      this.load();
    }).catch(() => {});
  }
});
