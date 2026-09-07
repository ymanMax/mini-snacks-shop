// pages/member/checkin.js —— 每日签到（模块 3.3）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    info: null,
    weekHead: ['日', '一', '二', '三', '四', '五', '六'],
    cells: [],        // 日历格子 [{day, signed, isToday} | null]
    activeRewards: 0, // 奖励梯度高亮格数
    todayReward: 0,   // 今日签到可得积分
    signing: false,
    floatText: '',    // 积分飘字
    showFloat: false
  },

  onShow() {
    this.loadInfo();
  },

  onPullDownRefresh() {
    this.loadInfo().then(() => wx.stopPullDownRefresh());
  },

  loadInfo() {
    return api.getCheckinInfo().then(info => {
      this.setData({
        info,
        loading: false,
        cells: this.buildCells(info),
        activeRewards: this.calcActive(info.continuousDays),
        todayReward: info.rewards[info.todaySigned ? (info.continuousDays - 1 + 7) % 7 : info.continuousDays % 7]
      });
    }).catch(() => this.setData({ loading: false }));
  },

  buildCells(info) {
    const firstWeek = new Date(info.year, info.month - 1, 1).getDay();
    const days = new Date(info.year, info.month, 0).getDate();
    const now = new Date();
    const isCurMonth = now.getFullYear() === info.year && now.getMonth() + 1 === info.month;
    const today = now.getDate();
    const cells = [];
    for (let i = 0; i < firstWeek; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      cells.push({
        day: d,
        signed: info.monthRecords.indexOf(d) > -1,
        isToday: isCurMonth && d === today
      });
    }
    return cells;
  },

  calcActive(continuousDays) {
    if (!continuousDays) return 0;
    const r = continuousDays % 7;
    return r === 0 ? 7 : r;
  },

  onSign() {
    const { info, signing } = this.data;
    if (!info || info.todaySigned || signing) return;
    this.setData({ signing: true });
    api.signCheckin().then(res => {
      // 积分飘字动画
      this.setData({ floatText: '+' + res.points, showFloat: true });
      setTimeout(() => this.setData({ showFloat: false }), 1500);
      toast.success('签到成功');
      this.loadInfo();
    }).catch(() => {}).then(() => {
      this.setData({ signing: false });
    });
  }
});
