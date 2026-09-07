// pages/coupon/center.js —— 领券中心 + 我的优惠券
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

// 券面文案：type 1满减 2折扣 3无门槛
function decorate(c) {
  const type = Number(c.type);
  let left = '';
  let sub = '';
  if (type === 2) {
    left = (Number(c.discount) / 10).toFixed(1) + '折';
    sub = c.threshold > 0 ? '满' + c.threshold + '可用' : '无门槛';
  } else {
    left = '¥' + c.discount;
    sub = type === 3 || Number(c.threshold) === 0 ? '无门槛' : '满' + c.threshold + '可用';
  }
  return Object.assign({}, c, { leftText: left, leftSmall: type === 2, subText: sub });
}

Page({
  data: {
    tab: 'center',        // center | mine
    loadingCenter: true,
    centerList: [],
    mineStatus: 1,        // 1未使用 2已使用 3已过期
    loadingMine: false,
    mineList: [],
    mineLoaded: false
  },

  onLoad(options) {
    if (options && options.tab === 'mine') {
      this.setData({ tab: 'mine' });
      this.loadMine();
    }
    this.loadCenter();
  },

  onPullDownRefresh() {
    Promise.all([this.loadCenter(), this.data.tab === 'mine' ? this.loadMine() : Promise.resolve()])
      .then(() => wx.stopPullDownRefresh());
  },

  loadCenter() {
    this.setData({ loadingCenter: true });
    return api.getCouponCenter().then(list => {
      this.setData({ centerList: list.map(decorate), loadingCenter: false });
    }).catch(() => this.setData({ loadingCenter: false }));
  },

  loadMine() {
    this.setData({ loadingMine: true });
    return api.getMyCoupons(this.data.mineStatus).then(list => {
      this.setData({ mineList: list.map(decorate), loadingMine: false, mineLoaded: true });
    }).catch(() => this.setData({ loadingMine: false, mineLoaded: true }));
  },

  onTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    if (tab === 'mine' && !this.data.mineLoaded) this.loadMine();
  },

  onMineStatus(e) {
    this.setData({ mineStatus: Number(e.currentTarget.dataset.status) });
    this.loadMine();
  },

  onClaim(e) {
    const item = this.data.centerList[e.currentTarget.dataset.index];
    if (item.claimed) return;
    api.claimCoupon(item.id).then(() => {
      toast.success('领取成功');
      this.loadCenter();
      if (this.data.mineLoaded) this.loadMine();
    }).catch(() => {});
  },

  goCenter() {
    this.setData({ tab: 'center' });
  },

  onImgError() {}
});
