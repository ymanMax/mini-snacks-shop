// pages/group/list.js —— 拼团列表（可参团/我的拼团/全部）+ 团购批发批量加购
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const { pad2, mul, priceText } = require('../../utils/format.js');

const STATUS_MAP = {
  1: { text: '拼团中', cls: 'orange' },
  2: { text: '已成团', cls: 'green' },
  3: { text: '未成团已退款', cls: 'gray' }
};

const TAB_APIS = {
  joinable: () => api.getJoinableGroups(),
  mine: () => api.getMyGroups(),
  all: () => api.getGroupList()
};

Page({
  data: {
    loading: true,
    tab: 'all',
    tabs: [
      { key: 'joinable', name: '可参团' },
      { key: 'mine', name: '我的拼团' },
      { key: 'all', name: '全部' }
    ],
    groups: [],
    wholesale: [],
    // 批量加购弹层
    wsShow: false,
    wsIndex: 0,
    wsItem: null,
    wsLadderIndex: 0,
    wsQty: 1,
    wsTotalCount: 0,
    wsTotalText: '0.00',
    wsImgErr: false
  },

  onLoad() {
    this.loadAll();
  },

  onShow() {
    this.startTimer();
    // 从拼团详情返回时静默刷新当前 Tab（参团状态可能已变化）
    if (!this.data.loading) this.loadGroups();
  },

  onHide() {
    this.stopTimer();
  },

  onUnload() {
    this.stopTimer();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  loadAll() {
    return Promise.all([this.loadGroups(true), this.loadWholesale()]);
  },

  // ===== Tab 切换 =====
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab, groups: [], loading: true });
    this.loadGroups(true);
  },

  loadGroups(showLoading) {
    const tab = this.data.tab;
    const fetcher = TAB_APIS[tab] || TAB_APIS.all;
    return fetcher().then(groups => {
      const list = (groups || []).map(g => {
        const sm = STATUS_MAP[g.status] || STATUS_MAP[1];
        return Object.assign({}, g, {
          statusText: sm.text,
          statusCls: sm.cls,
          lack: Math.max(0, g.requiredCount - g.joinedCount),
          roleText: tab === 'mine' ? (g.isLeader ? '团长' : '团员') : '',
          remain: ''
        });
      });
      this.setData({ groups: list, loading: false });
      this.tick();
    }).catch(() => {
      if (showLoading) this.setData({ loading: false });
    });
  },

  loadWholesale() {
    return api.getWholesale().then(wholesale => {
      const list = (wholesale || []).map(w => {
        const prices = (w.ladder || []).map(ld => ld.price);
        const min = Math.min.apply(null, prices.length ? prices : [0]);
        return Object.assign({}, w, {
          ladder: (w.ladder || []).map(ld => Object.assign({}, ld, { best: ld.price === min }))
        });
      });
      this.setData({ wholesale: list });
    }).catch(() => {});
  },

  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'groups'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  },

  onMemberImgError(e) {
    const { g, m } = e.currentTarget.dataset;
    this.setData({ [`groups[${g}].members[${m}]._imgErr`]: true });
  },

  // ===== 倒计时 =====
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), 1000);
    this.tick();
  },
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  tick() {
    const groups = this.data.groups;
    if (!groups.length) return;
    const now = Date.now();
    const patch = {};
    groups.forEach((g, i) => {
      const end = new Date(String(g.endTime).replace(/-/g, '/')).getTime();
      let diff = Math.floor((end - now) / 1000);
      let text;
      if (isNaN(diff) || diff <= 0) {
        text = '已截止';
      } else {
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        text = '剩 ' + pad2(h) + ':' + pad2(m) + ':' + pad2(s);
      }
      if (g.remain !== text) patch[`groups[${i}].remain`] = text;
    });
    if (Object.keys(patch).length) this.setData(patch);
  },

  // ===== 卡片跳转 =====
  onGoGroup(e) {
    wx.navigateTo({ url: '/pages/group/detail?id=' + e.currentTarget.dataset.id });
  },
  onViewGoods(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },
  onViewOrder(e) {
    const id = e.currentTarget.dataset.orderId;
    if (id) wx.navigateTo({ url: '/pages/order/detail?id=' + id });
  },
  onRestart() {
    toast.showToast('演示环境：重新发起拼团请前往商品详情');
  },
  // 「邀请好友」按钮：仅拦截冒泡，分享面板由 open-type="share" 触发，
  // shareReward 在 onShareAppMessage 中统一处理
  onShareBtn() {},

  // ===== 批量加购弹层 =====
  openWs(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.wholesale[index];
    if (!item) return;
    this.setData({
      wsShow: true,
      wsIndex: index,
      wsItem: item,
      wsLadderIndex: 0,
      wsQty: 1,
      wsImgErr: false
    }, () => this.updateWsTotal());
  },
  closeWs() {
    this.setData({ wsShow: false });
  },
  selectWsLadder(e) {
    this.setData({ wsLadderIndex: Number(e.currentTarget.dataset.index) }, () => this.updateWsTotal());
  },
  minusWsQty() {
    if (this.data.wsQty <= 1) return;
    this.setData({ wsQty: this.data.wsQty - 1 }, () => this.updateWsTotal());
  },
  plusWsQty() {
    this.setData({ wsQty: this.data.wsQty + 1 }, () => this.updateWsTotal());
  },
  // 数量换算：加购总件数 = 档位件数 × 份数，单价 = 档位每件价
  updateWsTotal() {
    const { wsItem, wsLadderIndex, wsQty } = this.data;
    if (!wsItem || !wsItem.ladder || !wsItem.ladder.length) return;
    const ld = wsItem.ladder[wsLadderIndex];
    const totalCount = ld.count * wsQty;
    this.setData({
      wsTotalCount: totalCount,
      wsTotalText: priceText(mul(ld.price, totalCount))
    });
  },
  confirmWs() {
    const { wsItem, wsLadderIndex, wsTotalCount } = this.data;
    if (!wsItem) return;
    const ld = wsItem.ladder[wsLadderIndex];
    api.addToCart({
      goodsId: wsItem.goodsId,
      specText: '批发 ' + ld.count + '件装',
      price: ld.price,
      count: wsTotalCount,
      pic: wsItem.pic
    }).then(() => {
      this.closeWs();
      toast.success('已加入购物车');
      getApp().refreshCartBadge();
    }).catch(() => {});
  },

  // ===== 分享裂变 =====
  onShareAppMessage(e) {
    const uid = getApp().globalData.userInfo.id;
    // 卡片内「邀请好友」按钮触发的分享：带上拼团信息
    if (e && e.from === 'button' && e.target && e.target.dataset && e.target.dataset.id) {
      const d = e.target.dataset;
      api.shareReward('group').then(() => {
        toast.showToast('分享成功 +5积分');
      }).catch(() => {});
      return {
        title: '【还差' + d.lack + '人】' + d.name + ' 拼团价￥' + priceText(d.price),
        path: '/pages/group/detail?id=' + d.id + '&inviteBy=' + uid,
        imageUrl: d.pic
      };
    }
    return {
      title: '零食商城拼团，一起拼更便宜',
      path: '/pages/group/list?inviteBy=' + uid
    };
  }
});
