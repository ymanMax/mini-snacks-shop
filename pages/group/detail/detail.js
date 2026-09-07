// pages/group/detail/detail.js —— 拼团详情：成员/倒计时/参团/开团/邀请/退款
const app = getApp();
const { groupApi, goodsApi, inviteApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    groupId: null,
    goods: null,
    group: null,
    invited: false,
    countdown: '',
    // 参团规格
    showSku: false,
    tastes: [],
    tasteIndex: 0,
    count: 1,
    joined: false,
    orderId: 0
  },

  onLoad(options) {
    if (options.goodsId && options.open === '1') {
      this.createGroup(Number(options.goodsId));
      return;
    }
    this.setData({ groupId: options.id, invited: options.invite === '1' });
    this.load(options.id);
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  load(id) {
    groupApi.getDetail(id).then((group) => {
      this.setData({ group });
      this.afterLoad(group);
    });
  },

  afterLoad(group) {
    goodsApi.getDetail(group.goodsId).then((g) => {
      const tastes = g.specs[1] ? g.specs[1].values.map((v) => v.label) : ['原味'];
      const myId = app.getUser ? app.getUser().id : 10001;
      const joined = group.members.some((m) => m.userId === myId) || !!group.myJoined;
      this.setData({ tastes, joined, goods: g });
      this.startTick();
    });
  },

  createGroup(goodsId) {
    goodsApi.getDetail(goodsId).then((g) => {
      const taste = g.specs[1] && g.specs[1].values[0] ? g.specs[1].values[0].label : '原味';
      const specText = '拼团专享 · ' + taste;
      groupApi.open({
        goodsId,
        specText,
        count: 1,
        price: g.price * 0.8,
        requiredCount: 3
      }).then((group) => {
        this.setData({ groupId: group.id, joined: true });
        this.setData({ group });
        this.afterLoad(group);
      });
    });
  },

  startTick() {
    const tick = () => {
      const g = this.data.group;
      if (!g) return;
      const end = new Date(String(g.endTime).replace(/-/g, '/')).getTime();
      let diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (g.status === 3) diff = 0;
      const h = Math.floor(diff / 3600);
      const m = Math.floor(diff % 3600 / 60);
      const s = diff % 60;
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      this.setData({ countdown: pad(h) + ':' + pad(m) + ':' + pad(s) });
    };
    tick();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(tick, 1000);
  },

  // ---- 参团 ----
  openSku() {
    if (this.data.group.status === 3) return;
    this.setData({ showSku: true });
  },
  closeSku() {
    this.setData({ showSku: false });
  },
  noop() {},
  pickTaste(e) {
    this.setData({ tasteIndex: Number(e.currentTarget.dataset.index) });
  },
  minus() {
    if (this.data.count > 1) this.setData({ count: this.data.count - 1 });
  },
  plus() {
    if (this.data.count < 5) this.setData({ count: this.data.count + 1 });
  },
  confirmJoin() {
    const g = this.data.group;
    const specText = '拼团专享 · ' + this.data.tastes[this.data.tasteIndex];
    groupApi.join(g.id, { specText, count: this.data.count }).then((res) => {
      this.setData({ showSku: false, joined: true });
      if (res.group.status === 2) {
        this.setData({ group: res.group, orderId: res.order ? res.order.id : 0 });
        toast.showSuccess('🎉 拼团成功');
      } else {
        this.setData({ group: res.group });
        wx.showModal({
          title: '参团成功',
          content: `还差 ${res.group.remainCount} 人成团，快邀请好友吧～`,
          showCancel: false,
          confirmColor: '#b4282d'
        });
      }
    }).catch(() => {});
  },

  // 模拟好友参团（演示邀请效果与成团）
  simulateJoin() {
    const g = this.data.group;
    const specText = '拼团专享 · ' + (this.data.tastes[this.data.tasteIndex] || '原味');
    groupApi.simulate(g.id, { specText, count: 1 }).then((res) => {
      if (res.group.status === 2) {
        this.setData({ group: res.group, orderId: res.order ? res.order.id : 0 });
        toast.showSuccess('🎉 已成团，订单已生成');
      } else {
        this.setData({ group: res.group });
        toast.showToast('好友参团成功，还差 ' + res.group.remainCount + ' 人');
      }
    });
  },

  // 邀请新用户奖励
  inviteReward() {
    inviteApi.reward().then((res) => {
      wx.showModal({
        title: '邀请成功',
        content: `好友通过你的链接注册，${res.points} 积分与「${res.coupon}」已到账！`,
        showCancel: false,
        confirmColor: '#b4282d'
      });
    }).catch(() => {});
  },

  goOrder() {
    if (this.data.orderId) {
      wx.redirectTo({ url: '/pages/order/detail/detail?id=' + this.data.orderId });
    } else {
      wx.navigateTo({ url: '/pages/order/list/list?status=2' });
    }
  },

  goGoods() {
    const gid = this.data.group ? this.data.group.goodsId : '';
    wx.navigateTo({ url: '/pages/detail/detail?product_id=' + gid });
  },

  onShareAppMessage() {
    const g = this.data.group || {};
    // 分享裂变：每次有效分享 +5 积分（每日上限 3 次）
    groupApi.shareReward('group').then((res) => {
      if (res.awarded) toast.showToast('分享成功，积分 +' + res.points);
    }).catch(() => {});
    return {
      title: `还差 ${Math.max(g.remainCount || 0, 1)} 人成团！「${g.name}」拼团价 ¥${g.groupPrice}，快来一起拼～`,
      imageUrl: g.pic,
      path: `/pages/group/detail/detail?id=${g.id}&invite=1`
    };
  },

  onShareTimeline() {
    const g = this.data.group || {};
    return { title: `3人拼团「${g.name}」仅¥${g.groupPrice}`, query: 'id=' + g.id + '&invite=1' };
  }
});
