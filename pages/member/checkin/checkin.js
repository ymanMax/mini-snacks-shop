// pages/member/checkin/checkin.js — 每日签到
// 签到日历 / 连续奖励梯度均为纯 CSS/WXML 实现；数据统一走 api/index.js
const api = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const WEEK_HEAD = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    weekHead: WEEK_HEAD,
    info: null,          // api.checkin.info() 原始数据
    cells: [],           // 日历格子 [{ day, signed, isToday } | null 占位]
    rewardCells: [],     // 7 个奖励格 [{ points, isBig, status: done|current|todo }]
    signing: false,      // 签到请求中
    floatPoints: 0,      // +N 积分上浮动画
    showFloat: false,
    firstLoading: true
  },

  onLoad() {
    this.loadInfo();
  },

  onShow() {
    // 跨天 / 从积分页返回时同步
    if (!this.data.firstLoading) this.loadInfo();
  },

  onPullDownRefresh() {
    this.loadInfo().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh());
  },

  /** 拉取签到信息并构建日历与奖励梯度 */
  loadInfo() {
    return api.checkin.info().then((res) => {
      const info = res.data || {};
      this.setData({ info, firstLoading: false });
      this._buildCalendar(info);
      this._buildRewards(info);
    }).catch(() => {
      this.setData({ firstLoading: false });
    });
  },

  /**
   * 构建当月日历格子
   * 首格偏移：new Date(year, monthNum - 1, 1).getDay()（周日=0）
   * 例：2026-09 → new Date(2026, 8, 1).getDay() === 2（9月1日是周二），前面留 2 个空占位
   */
  _buildCalendar(info) {
    const year = Number(info.year) || new Date().getFullYear();
    const monthNum = Number(info.monthNum) || (new Date().getMonth() + 1);
    const daysInMonth = Number(info.daysInMonth) || new Date(year, monthNum, 0).getDate();
    const today = Number(info.today) || new Date().getDate();
    const records = info.monthRecords || [];

    const offset = new Date(year, monthNum - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null); // 上月日期留空占位
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        signed: records.indexOf(d) > -1,
        isToday: d === today
      });
    }
    const tail = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < tail; i++) cells.push(null); // 下月日期留空占位
    this.setData({ cells });
  },

  /**
   * 连续奖励梯度：rewards [5,5,10,10,15,20,50]，7 天一循环
   * 当前进度位置 = continuousDays % 7（已签满 7 天回到第 1 格）
   */
  _buildRewards(info) {
    const rewards = info.rewards || [5, 5, 10, 10, 15, 20, 50];
    const continuous = Number(info.continuousDays) || 0;
    // 今日已签：当前格为 continuousDays 对应格；未签：下一个待达成格
    const currentIdx = info.todaySigned
      ? ((continuous - 1) % 7 + 7) % 7
      : continuous % 7;
    const doneCount = info.todaySigned ? currentIdx + 1 : currentIdx;

    const rewardCells = rewards.map((p, i) => ({
      day: i + 1,
      points: p,
      isBig: i === 6,
      status: i < doneCount ? 'done' : (i === currentIdx ? 'current' : 'todo')
    }));
    this.setData({ rewardCells });
  },

  /** 立即签到 */
  onSign() {
    const info = this.data.info;
    if (!info || info.todaySigned || this.data.signing) return;
    this.setData({ signing: true });
    toast.showLoading('签到中...');
    api.checkin.sign().then((res) => {
      toast.hideLoading();
      this.setData({ signing: false });
      const d = res.data || {};
      // +N 积分上浮动画（纯 CSS animation）
      this.setData({ floatPoints: d.points || 0, showFloat: true });
      setTimeout(() => this.setData({ showFloat: false }), 1600);
      toast.showSuccess('签到成功 +' + (d.points || 0) + ' 积分');
      // 刷新日历与梯度（重查 info 保证跨天/连签数准确）
      this.loadInfo();
    }).catch(() => {
      toast.hideLoading();
      this.setData({ signing: false });
      this.loadInfo();
    });
  },

  onGoPoints() {
    wx.navigateTo({ url: '/pages/member/points/points' });
  }
});
