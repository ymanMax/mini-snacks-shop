/**
 * 限时秒杀场次页（V1.1 优化1：促销活动落地）
 *
 * 功能：秒杀场次头卡（深红渐变 + 倒计时翻牌）/ 秒杀商品列表（抢购进度条·纯 CSS）
 *      / 满减活动卡（阶梯胶囊 + 去凑单）/ 提醒我（写入消息中心）
 *
 * 规范：
 *  - 取数一律走 api/index.js（api.promotion.current / api.promotion.remind）
 *  - 倒计时 setInterval 每秒刷新（纯 JS），onHide/onUnload 清理定时器
 *  - 图片 binderror 回退 /static/images/default.png；toast 走 utils/toast.js
 *  - 金额展示走 utils/format.wxs（wxml）与 utils/format.js（JS）
 */
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const format = require('../../utils/format.js');

const DEFAULT_IMG = '/static/images/default.png';
const HOT_PERCENT = 90; // soldPercent >= 90 → "即将售罄" 闪烁

/** 秒 → 翻牌数字块 { h1,h2,m1,m2,s1,s2 }（补零后逐位拆分，纯 JS） */
function cdDigits(seconds) {
  const t = format.countdown(seconds);
  return {
    // 小时可能超过两位（跨天场次），前块整体承载多余位数
    h1: t.h.length > 1 ? t.h.slice(0, -1) : '0',
    h2: t.h.slice(-1),
    m1: t.m[0],
    m2: t.m[1],
    s1: t.s[0],
    s2: t.s[1]
  };
}

/** 秒杀商品装饰：进度百分比兜底计算 + 状态标记 */
function decorateSeckillGoods(g) {
  const stock = Math.max(0, Number(g.stock) || 0);
  const sold = Math.max(0, Number(g.sold) || 0);
  let percent = Number(g.soldPercent);
  if (isNaN(percent)) {
    percent = stock + sold > 0 ? Math.round((sold / (stock + sold)) * 100) : 0;
  }
  percent = Math.max(0, Math.min(100, percent));
  return Object.assign({}, g, {
    stock,
    sold,
    soldPercent: percent,
    soldOut: stock <= 0, // 已抢光（按钮置灰）
    hot: percent >= HOT_PERCENT && stock > 0 // 即将售罄（闪烁动画）
  });
}

Page({
  data: {
    loading: true, // 首屏骨架屏
    seckill: null, // type=1 秒杀场次（含装饰后的 goodsList）
    fullReduce: null, // type=2 满减促销
    ended: false, // 本场是否已结束
    cd: cdDigits(0), // 倒计时翻牌数字块（距结束 HH:MM:SS）
    DEFAULT_IMG
  },

  onLoad() {
    this._reminding = false;
    this._timer = null;
    this._remain = 0;
    this.loadData();
  },

  /** onShow 重新拉取：场次余量 / 倒计时保持最新，并恢复定时器 */
  onShow() {
    if (!this.data.loading) this.loadData();
  },

  onHide() {
    this.stopTimer();
  },

  onUnload() {
    // ★ 清理倒计时定时器
    this.stopTimer();
    toast.hideLoadingForce();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  /* ==================== 数据加载 ==================== */

  loadData() {
    return api.promotion
      .current()
      .then((res) => {
        const list = (res && res.data) || [];
        const seckillRaw = list.filter((p) => Number(p.type) === 1)[0] || null;
        const fullReduce = list.filter((p) => Number(p.type) === 2)[0] || null;

        let seckill = null;
        let ended = true;
        let cd = cdDigits(0);
        let remain = 0;
        if (seckillRaw) {
          remain = Math.max(0, Number(seckillRaw.remainSeconds) || 0);
          ended = remain <= 0;
          cd = cdDigits(remain);
          seckill = Object.assign({}, seckillRaw, {
            remainSeconds: remain,
            goodsList: (seckillRaw.goodsList || []).map(decorateSeckillGoods)
          });
        }

        this.setData({ seckill, fullReduce, ended, cd, loading: false });

        // 重建定时器（onShow 重拉后剩余秒数以最新接口为准）
        this.stopTimer();
        if (seckill && !ended) {
          this._remain = remain;
          this.startTimer();
        }
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  /* ==================== 倒计时（页面级单一定时器，每秒刷新） ==================== */

  startTimer() {
    if (this._timer) return;
    this._timer = setInterval(() => this.tick(), 1000);
  },

  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  tick() {
    this._remain = Math.max(0, (this._remain || 0) - 1);
    if (this._remain <= 0) {
      // 归零：显示"本场已结束"，停止定时器
      this.stopTimer();
      this.setData({ ended: true, cd: cdDigits(0) });
      return;
    }
    this.setData({ cd: cdDigits(this._remain) });
  },

  /* ==================== 交互 ==================== */

  /** 提醒我：写入秒杀开场提醒消息 */
  onRemind() {
    if (this._reminding) return;
    this._reminding = true;
    const id = (this.data.seckill && this.data.seckill.id) || 1;
    api.promotion
      .remind(id)
      .then(() => {
        toast.showToast('已设置开场提醒，可在消息中心查看');
      })
      .catch(() => {
        // http 层已 toast 错误
      })
      .then(() => {
        this._reminding = false;
      });
  },

  /** 立即抢购 / 商品图 / 名称 → 商品详情（已抢光置灰不可点） */
  onGoDetail(e) {
    const goodsId = e.currentTarget.dataset.goodsId;
    const soldOut = e.currentTarget.dataset.soldOut;
    if (!goodsId || soldOut) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + goodsId });
  },

  /** 去凑单：满减卡按钮 → 分类 Tab 页 */
  onGoCoudan() {
    wx.switchTab({ url: '/pages/classic/classic' });
  },

  /** 空态按钮：重新加载 */
  onReload() {
    this.setData({ loading: true });
    this.loadData();
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const key = 'seckill.goodsList[' + index + '].pic';
    this.setData({ [key]: DEFAULT_IMG });
  }
});
