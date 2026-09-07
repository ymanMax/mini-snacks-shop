// pages/promotion/index/index.js —— 限时抢购场次 + 满减阶梯 + 团购批发
const app = getApp();
const { promotionApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    sessions: [],
    activeSession: 0,
    countdown: '',
    fullRules: [],
    wholesale: [],
    // 批发加购弹层
    wsSheet: false,
    curWholesale: null
  },

  onLoad() {
    this.timer = null;
    promotionApi.getAll().then((data) => {
      const active = data.sessions.findIndex((s) => s.status === 1);
      this.setData({
        sessions: data.sessions,
        activeSession: active === -1 ? 0 : active,
        fullRules: data.fullReduceRules,
        wholesale: data.wholesale
      });
      this.startTick();
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  switchSession(e) {
    this.setData({ activeSession: Number(e.currentTarget.dataset.index) });
    this.startTick();
  },

  startTick() {
    const tick = () => {
      const s = this.data.sessions[this.data.activeSession];
      if (!s) return;
      const left = s.status === 1 ? s.endSeconds : s.startSeconds;
      const h = Math.floor(left / 3600);
      const m = Math.floor(left % 3600 / 60);
      const sec = left % 60;
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      this.setData({ countdown: pad(h) + ':' + pad(m) + ':' + pad(sec) });
      // 每秒同步给场次数据
      if (s.status === 1) s.endSeconds = Math.max(0, s.endSeconds - 1);
      else if (s.status === 0) s.startSeconds = Math.max(0, s.startSeconds - 1);
    };
    tick();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(tick, 1000);
  },

  // 立即抢购
  buy(e) {
    const s = this.data.sessions[this.data.activeSession];
    if (!s || s.status !== 1) {
      toast.showToast('该场次还未开始');
      return;
    }
    const goodsId = Number(e.currentTarget.dataset.goodsid);
    wx.showActionSheet({
      itemList: ['加入购物车（抢购价）', '立即抢购下单'],
      success: (res) => {
        const mode = res.tapIndex === 1 ? 'buy' : 'cart';
        promotionApi.seckillBuy({ sessionId: s.id, goodsId, count: 1, mode }).then((data) => {
          toast.showSuccess(mode === 'buy' ? '正在前往结算' : '已按抢购价加入购物车');
          app.updateCartBadge();
          this.setData({}); // 刷新进度条
          if (mode === 'buy' && data.buyNow) {
            app.globalData.buyNow = data.buyNow;
            wx.navigateTo({ url: '/pages/order/confirm/confirm?from=buy' });
          }
        }).catch(() => {});
      }
    });
  },

  // ---- 批发阶梯加购 ----
  openWholesale(e) {
    const id = Number(e.currentTarget.dataset.id);
    const cur = this.data.wholesale.find((x) => x.id === id);
    const ladderIndex = 0;
    this.setData({
      wsSheet: true,
      curWholesale: Object.assign({}, cur, {
        ladderIndex,
        count: cur.ladder[ladderIndex].count,
        unitPrice: cur.ladder[ladderIndex].price
      })
    });
  },
  closeSheet() {
    this.setData({ wsSheet: false });
  },
  noop() {},
  pickLadder(e) {
    const index = Number(e.currentTarget.dataset.index);
    const cur = this.data.curWholesale;
    this.setData({
      curWholesale: Object.assign({}, cur, {
        ladderIndex: index,
        count: cur.ladder[index].count,
        unitPrice: cur.ladder[index].price
      })
    });
  },
  confirmWholesale() {
    const cur = this.data.curWholesale;
    promotionApi.wholesaleBuy({ id: cur.id, count: cur.count }).then(() => {
      this.setData({ wsSheet: false });
      toast.showSuccess(`已按批发价加入购物车（${cur.count} 件）`);
      app.updateCartBadge();
    }).catch(() => {});
  }
});
