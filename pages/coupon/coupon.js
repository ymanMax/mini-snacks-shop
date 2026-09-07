// pages/coupon/coupon.js — 优惠券（领券中心 / 我的优惠券）
// 数据统一走 api/index.js；toast 走 utils/toast.js
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

/** 金额文案：整数不带小数（10 → "10"），小数保留（7.5 → "7.5"） */
function amountText(n) {
  const v = Number(n) || 0;
  if (v % 1 === 0) return String(v);
  return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** 折扣文案：88 → "8.8"（外面拼"折"字） */
function discountText(n) {
  const v = (Number(n) || 0) / 10;
  if (v % 1 === 0) return v.toFixed(0);
  return v.toFixed(1);
}

/** 优惠券展示字段装饰 */
function decorate(c) {
  const isDiscount = c.type === 2;
  return Object.assign({}, c, {
    isDiscount,
    bigText: isDiscount ? discountText(c.discount) : amountText(c.discount),
    thresholdText: Number(c.threshold) > 0 ? '满' + amountText(c.threshold) + '元可用' : '无门槛',
    statusText: c.status === 2 ? '已使用' : c.status === 3 ? '已过期' : ''
  });
}

Page({
  data: {
    tab: 'available',          // available 领券中心 | mine 我的优惠券
    subStatus: 1,              // 我的优惠券子 Tab：1未使用/2已使用/3已过期
    subTabs: [
      { label: '未使用', value: 1 },
      { label: '已使用', value: 2 },
      { label: '已过期', value: 3 }
    ],
    availableList: [],
    mineList: [],
    firstLoading: true
  },

  onLoad(options) {
    const tab = options && options.tab === 'mine' ? 'mine' : 'available';
    this.setData({ tab });
  },

  onShow() {
    this.loadCurrent();
  },

  /* ---------- 数据加载 ---------- */
  loadCurrent() {
    return this.data.tab === 'available' ? this.loadAvailable() : this.loadMine();
  },

  loadAvailable() {
    return api.coupon.available().then((res) => {
      const list = (res.data || []).map(decorate);
      this.setData({ availableList: list, firstLoading: false });
    }).catch(() => this.setData({ firstLoading: false }));
  },

  loadMine() {
    return api.coupon.mine(this.data.subStatus).then((res) => {
      const list = (res.data || []).map(decorate);
      this.setData({ mineList: list, firstLoading: false });
    }).catch(() => this.setData({ firstLoading: false }));
  },

  /* ---------- Tab 切换 ---------- */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab, firstLoading: true });
    this.loadCurrent();
  },

  onSubChange(e) {
    const subStatus = Number(e.currentTarget.dataset.status);
    if (subStatus === this.data.subStatus) return;
    this.setData({ subStatus, firstLoading: true });
    this.loadMine();
  },

  /* ---------- 领券 ---------- */
  onReceive(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.availableList[index];
    if (!item || item.received) return;
    toast.showLoading('领取中...');
    api.coupon.receive(item.id).then((res) => {
      toast.hideLoading();
      toast.showSuccess((res.data && res.data.msg) || '领取成功');
      this.loadAvailable();
    }).catch(() => toast.hideLoading());
  },

  /* ---------- 去使用 / 去领券中心 ---------- */
  onUse() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onGoAvailable() {
    this.setData({ tab: 'available', firstLoading: true });
    this.loadAvailable();
  }
});
