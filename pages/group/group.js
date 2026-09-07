// pages/group/group.js — 拼团特惠（拼团专区 / 团购批发 / 我的拼团）
// V1.1 优化5：卡片跳拼团详情 / 我要开团（商品选择半屏层）/ 批发阶梯批量加购 / 邀请好友得券
// 数据统一走 api/index.js；toast/confirm 走 utils/toast.js
// 倒计时：setInterval 每秒刷新，onHide/onUnload 清理定时器
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const format = require('../../utils/format.js');

const app = getApp();
const DEFAULT_IMG = '/static/images/default.png';
const STATUS_TEXT = { 1: '拼团中', 2: '已成团', 3: '已退款' };

/** 秒 → HH:MM:SS */
function cdText(seconds) {
  const t = format.countdown(seconds);
  return t.h + ':' + t.m + ':' + t.s;
}

/** 拼团卡展示字段装饰 */
function decorateGroup(g) {
  // group/list 返回 remainSeconds；group/mine 仅有 endTimestamp，本地兜底计算
  const remain = g.remainSeconds !== undefined
    ? Math.max(0, Number(g.remainSeconds) || 0)
    : Math.max(0, Math.floor(((g.endTimestamp || 0) - Date.now()) / 1000));
  const lack = Math.max(0, (g.requiredCount || 0) - (g.joinedCount || 0));
  // 成员头像排：不足人数用空位占位（虚位以待）
  const slots = [];
  for (let i = 0; i < g.requiredCount; i++) {
    const m = (g.members && g.members[i]) || null;
    slots.push(m
      ? Object.assign({ key: 'slot-' + i }, m)
      : { key: 'slot-' + i, empty: true });
  }
  return Object.assign({}, g, {
    remainSeconds: remain,
    lack,
    slots,
    statusText: STATUS_TEXT[g.status] || '',
    countdownText: remain > 0 ? cdText(remain) : '已结束'
  });
}

/** 批发卡装饰：标记阶梯最优价 */
function decorateWholesale(w) {
  const ladder = (w.ladder || []).map((l) => Object.assign({}, l));
  let best = Infinity;
  ladder.forEach((l) => { if (Number(l.price) < best) best = Number(l.price); });
  ladder.forEach((l) => { l.best = Number(l.price) === best; });
  return Object.assign({}, w, { ladder });
}

Page({
  data: {
    tab: 'list',            // list 拼团专区 | wholesale 团购批发 | mine 我的拼团
    groups: [],
    wholesales: [],
    firstLoading: true,

    /* 参团成功弹层（适配 join 新返回结构 {group, order, msg}） */
    showJoinSuccess: false,
    joinOrderId: '',
    joinGroupId: '',
    joinMsg: '',

    /* 我要开团：商品选择半屏层 */
    showCreate: false,
    createLoading: false,
    createGoods: [],
    createSelIndex: -1,
    createCount: 1
  },

  onLoad(options) {
    const t = options && options.tab;
    const tab = (t === 'wholesale' || t === 'mine') ? t : 'list';
    this.loaded = false;
    this._joining = false;
    this._creating = false;
    this._inviting = false;
    this.setData({ tab });
    this.loadTabData(tab);
  },

  onShow() {
    // 回到页面时刷新数据（开团/参团/支付返回后状态可能已变化）并恢复倒计时
    if (this.loaded) this.loadTabData(this.data.tab);
    else if (this.data.groups.length) this.startTimer();
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
    this.loadTabData(this.data.tab).then(() => wx.stopPullDownRefresh());
  },

  /** 遮罩禁止穿透滚动 */
  noop() {},

  /* ---------- 数据加载 ---------- */
  loadTabData(tab) {
    return tab === 'mine' ? this.loadMine() : this.loadList();
  },

  /** 拼团专区 + 团购批发（同一接口） */
  loadList() {
    return api.group.list().then((res) => {
      const d = res.data || {};
      const groups = (d.groups || []).map(decorateGroup);
      const wholesales = (d.wholesales || []).map(decorateWholesale);
      this.setData({ groups, wholesales, firstLoading: false });
      this.loaded = true;
      this.startTimer();
    }).catch(() => {
      this.setData({ firstLoading: false });
      this.loaded = true;
      this.startTimer();
    });
  },

  /** 我的拼团（接口已附 remainSeconds） */
  loadMine() {
    return api.group.mine().then((res) => {
      const groups = (res.data || []).map(decorateGroup);
      this.setData({ groups, firstLoading: false });
      this.loaded = true;
      this.startTimer();
    }).catch(() => {
      this.setData({ firstLoading: false });
      this.loaded = true;
      this.startTimer();
    });
  },

  /* ---------- 倒计时（每秒刷新，页面级单一定时器） ---------- */
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
    const groups = this.data.groups;
    if (!groups || !groups.length) return;
    const patch = {};
    let changed = false;
    groups.forEach((g, i) => {
      if (g.status !== 1 || g.remainSeconds <= 0) return;
      const r = g.remainSeconds - 1;
      patch['groups[' + i + '].remainSeconds'] = r;
      patch['groups[' + i + '].countdownText'] = r > 0 ? cdText(r) : '已结束';
      changed = true;
    });
    if (changed) this.setData(patch);
  },

  /* ---------- Tab 切换 ---------- */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.stopTimer();
    this.setData({ tab, firstLoading: true });
    this.loadTabData(tab);
  },

  /* ---------- 卡片点击 → 拼团详情 ---------- */
  onTapGroup(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pages/group/detail?id=' + id,
      fail: () => toast.showError('页面不存在')
    });
  },

  /* ---------- 参团（适配 join 新返回结构 {group, order, msg}） ---------- */
  onJoin(e) {
    const index = Number(e.currentTarget.dataset.index);
    const g = this.data.groups[index];
    if (!g || g.status !== 1 || g.remainSeconds <= 0 || g.lack <= 0) return;
    if (this._joining) return;
    toast.confirm('确认以 ' + format.formatPrice(g.groupPrice) + ' 参团并生成订单？（演示环境，不产生真实交易）', '参团确认').then((ok) => {
      if (!ok) return;
      this._joining = true;
      toast.showLoading('参团中...');
      api.group.join({ id: g.id }).then((res) => {
        toast.hideLoading();
        const d = res.data || {};
        const order = d.order || null;
        const msg = d.msg || '参团成功';
        this.loadTabData(this.data.tab);
        if (order && order.id) {
          // 生成订单 → 弹"参团成功"模态（去支付 / 邀请好友）
          this.setData({ showJoinSuccess: true, joinOrderId: order.id, joinGroupId: g.id, joinMsg: msg });
        } else {
          toast.showSuccess(msg);
        }
      }).catch(() => toast.hideLoading()).then(() => {
        this._joining = false;
      });
    });
  },

  /** 参团成功弹层：去支付（订单详情 justCreated=1） */
  onGoPayOrder() {
    const oid = this.data.joinOrderId;
    this.setData({ showJoinSuccess: false });
    if (!oid) return;
    wx.navigateTo({
      url: '/pages/order/detail?id=' + oid + '&justCreated=1',
      fail: () => toast.showError('打开订单失败')
    });
  },

  onCloseSuccess() {
    this.setData({ showJoinSuccess: false });
  },

  /* ---------- 分享裂变（参团成功弹层"邀请好友"按钮 open-type=share） ---------- */
  onShareAppMessage() {
    const gid = this.data.joinGroupId;
    let g = null;
    if (gid) {
      g = (this.data.groups || []).filter((x) => Number(x.id) === Number(gid))[0] || null;
      this.grantShareReward(gid);
      const price = format.toFixed2((g && g.groupPrice) || 0);
      const name = (g && g.name) || '好物';
      const lack = (g && g.lack) || 0;
      return {
        title: lack > 0
          ? '【' + price + '元拼' + name + '】还差' + lack + '人，快来帮我砍一团！'
          : '【' + price + '元拼' + name + '】已成团，快来一起拼！',
        path: '/pages/group/detail?id=' + gid,
        imageUrl: (g && g.pic) || DEFAULT_IMG
      };
    }
    return {
      title: '零食商城拼团特惠，好物低价一起拼！',
      path: '/pages/group/group'
    };
  },

  grantShareReward(gid) {
    api.share.reward('group', gid).then((res) => {
      if (res && res.code === 200) toast.showToast('分享成功 +5积分');
    }).catch(() => {});
  },

  /* ---------- 我要开团：商品选择半屏层 ---------- */
  onOpenCreate() {
    this.setData({ showCreate: true });
    if (this.data.createGoods.length) return;
    this.setData({ createLoading: true });
    api.goods.page({ current: 1, size: 8, sort: 'sales' }).then((res) => {
      const d = res.data || {};
      const list = (d.records || []).map((g) => {
        const spec0 = (g.specs && g.specs[0] && g.specs[0].values && g.specs[0].values[0]) || {};
        return {
          id: g.id,
          name: g.name,
          pic: g.pic,
          minPrice: g.minPrice,
          groupPrice: Math.round((Number(g.minPrice) || 0) * 0.85 * 100) / 100,
          specLabel: spec0.label || '默认',
          stock: Math.max(1, Number(spec0.stock !== undefined ? spec0.stock : g.stock) || 1)
        };
      });
      this.setData({
        createGoods: list,
        createLoading: false,
        createSelIndex: list.length ? 0 : -1,
        createCount: 1
      });
    }).catch(() => {
      this.setData({ createLoading: false });
    });
  },

  onCloseCreate() {
    this.setData({ showCreate: false });
  },

  onSelectCreateGoods(e) {
    const i = Number(e.currentTarget.dataset.index);
    if (i === this.data.createSelIndex) return;
    this.setData({ createSelIndex: i, createCount: 1 });
  },

  onCreateMinus() {
    if (this.data.createCount <= 1) return;
    this.setData({ createCount: this.data.createCount - 1 });
  },

  onCreatePlus() {
    const sel = this.data.createGoods[this.data.createSelIndex];
    const max = sel ? (sel.stock || 99) : 99;
    if (this.data.createCount >= max) {
      toast.showToast('超出库存');
      return;
    }
    this.setData({ createCount: this.data.createCount + 1 });
  },

  /** 确认开团 → api.group.create({group, order}) → 跳新团详情页 */
  onConfirmCreate() {
    const sel = this.data.createGoods[this.data.createSelIndex];
    if (!sel) {
      toast.showToast('请选择商品');
      return;
    }
    if (this._creating) return;
    this._creating = true;
    toast.showLoading('开团中...');
    api.group.create({
      goodsId: sel.id,
      specText: sel.specLabel,
      count: this.data.createCount
    }).then((res) => {
      toast.hideLoading();
      const d = res.data || {};
      const ng = d.group || {};
      this.setData({ showCreate: false });
      toast.showSuccess('开团成功，快邀请好友参团');
      if (ng.id) {
        wx.navigateTo({
          url: '/pages/group/detail?id=' + ng.id,
          fail: () => this.loadTabData(this.data.tab)
        });
      } else {
        this.loadTabData(this.data.tab);
      }
    }).catch(() => {
      toast.hideLoading();
    }).then(() => {
      this._creating = false;
    });
  },

  /* ---------- 团购批发：阶梯批量加购 ---------- */
  onBatchAdd(e) {
    const ds = e.currentTarget.dataset;
    const goodsId = ds.goodsId;
    const count = Number(ds.count);
    const price = Number(ds.price);
    if (!goodsId || !count) return;
    toast.showLoading('加入中...');
    api.cart.add({
      goodsId,
      specText: '团购批发 x' + count + '件',
      price,
      count,
      stock: 999
    }).then(() => {
      toast.hideLoading();
      toast.showSuccess('已按团购价加入购物车');
      if (app && app.refreshCartBadge) app.refreshCartBadge();
    }).catch(() => {
      toast.hideLoading();
    });
  },

  /* ---------- 团购批发：跳商品详情 ---------- */
  onWholesale(e) {
    const goodsId = e.currentTarget.dataset.goodsId;
    if (!goodsId) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + goodsId });
  },

  /* ---------- 邀请好友得券（模拟邀请成功） ---------- */
  onInvite() {
    if (this._inviting) return;
    this._inviting = true;
    api.share.invite().then((res) => {
      const d = res.data || {};
      toast.showSuccess(d.msg || '邀请成功，优惠券已到账');
    }).catch(() => {
      // 失败原因（如"今日已获得邀请奖励"）http 层已自动 toast
    }).then(() => {
      this._inviting = false;
    });
  },

  /* ---------- 我的拼团空态：去拼团专区 ---------- */
  onGoList() {
    this.stopTimer();
    this.setData({ tab: 'list', firstLoading: true });
    this.loadList();
  },

  /* ---------- 图片兜底 ---------- */
  onImgError(e) {
    const path = e.currentTarget.dataset.path;
    if (path) this.setData({ [path]: DEFAULT_IMG });
  }
});
