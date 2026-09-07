// pages/seckill/index.js —— 限时抢购场次页（优化 1 · V1.1）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { pad2 } = require('../../utils/format.js');

Page({
  data: {
    loading: true,
    sessions: [],        // status 1进行中 2即将开始 3已结束
    activeIndex: 0,
    activeSession: null,
    cd: {}               // { [sessionId]: 'hh:mm:ss' } 每秒刷新
  },

  onLoad() {
    this.loadSessions(true);
  },

  onUnload() {
    this.clearTimer();
  },

  onPullDownRefresh() {
    this.loadSessions(false).finally(() => wx.stopPullDownRefresh());
  },

  // ===== 数据加载 =====
  loadSessions(showSkeleton) {
    if (showSkeleton) this.setData({ loading: true });
    return api.getSeckillSessions().then(res => {
      const sessions = (res && res.sessions) || [];
      let activeIndex = this.data.activeIndex;
      // 首次加载默认选中进行中的场次；用户手动选过后保持其选择
      if (!this.picked || !sessions[activeIndex]) {
        const doing = sessions.findIndex(s => s.status === 1);
        activeIndex = doing > -1 ? doing : 0;
      }
      this.setData({
        sessions,
        activeIndex,
        activeSession: sessions[activeIndex] || null,
        loading: false
      }, () => this.startTimer());
    }).catch(() => this.setData({ loading: false }));
  },

  // ===== 场次 Tab =====
  onTab(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === this.data.activeIndex) return;
    this.picked = true;
    this.setData({
      activeIndex: index,
      activeSession: this.data.sessions[index] || null
    }, () => this.tick());
  },

  // ===== 倒计时（每秒刷新，onUnload 清理）=====
  startTimer() {
    this.clearTimer();
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const cd = {};
    this.data.sessions.forEach(s => {
      const target = s.status === 1 ? Number(s.endTime) : s.status === 2 ? Number(s.startTime) : 0;
      if (!target) return;
      const diff = target - Date.now();
      cd[s.id] = this.formatDiff(diff > 0 ? diff : 0);
    });
    this.setData({ cd });
  },

  formatDiff(diff) {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // ===== 交互 =====
  goDetail(e) {
    // 仅进行中场次可点击抢购，其余置灰
    if (!this.data.activeSession || this.data.activeSession.status !== 1) return;
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onRemind() {
    toast.showToast('已设置提醒，开场后第一时间通知你');
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // ===== 分享得积分 =====
  onShareAppMessage() {
    api.shareReward('goods').then(() => toast.showToast('+5 积分')).catch(() => {});
    const uid = getApp().globalData.userInfo.id;
    return {
      title: '限时抢购，手慢无！',
      path: '/pages/seckill/index?inviteBy=' + uid
    };
  },

  // ===== 图片兜底（契约 §5）=====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
