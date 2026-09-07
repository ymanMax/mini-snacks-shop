// pages/group/detail.js — 拼团详情（V1.1 优化5：拼团与社交裂变落地）
// 数据统一走 api/index.js；toast/confirm 走 utils/toast.js；金额 JS 侧走 utils/format.js
// 倒计时：setInterval 每秒刷新，onHide/onUnload 清理定时器
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const format = require('../../utils/format.js');

const DEFAULT_IMG = '/static/images/default.png';
const STATUS_TEXT = { 1: '拼团中', 2: '已成团', 3: '已退款' };

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** 秒 → HH:MM:SS */
function cdText(seconds) {
  const t = format.countdown(seconds);
  return t.h + ':' + t.m + ':' + t.s;
}

/** 拼团展示字段装饰：成员头像排（虚位以待占位）/ 进度文案 / 倒计时 / 立省金额 */
function decorateGroup(g) {
  const remain = Math.max(0, Number(g.remainSeconds) || 0);
  const requiredCount = g.requiredCount || 0;
  const joinedCount = g.joinedCount || 0;
  const lack = Math.max(0, requiredCount - joinedCount);
  const slots = [];
  for (let i = 0; i < requiredCount; i++) {
    const m = (g.members && g.members[i]) || null;
    slots.push(m
      ? Object.assign({ key: 'slot-' + i }, m)
      : { key: 'slot-' + i, empty: true });
  }
  const status = g.status;
  let progressText = '';
  if (status === 1) progressText = remain > 0 ? ('还差 ' + lack + ' 人成团，速来！') : '拼团已结束';
  else if (status === 2) progressText = '已成团 🎉';
  else progressText = '未成团已自动退款';
  return Object.assign({}, g, {
    remainSeconds: remain,
    lack,
    slots,
    expired: remain <= 0,
    save: Math.max(0, round2((g.originalPrice || 0) - (g.groupPrice || 0))),
    statusText: STATUS_TEXT[status] || '',
    progressText,
    cd: format.countdown(remain),
    countdownText: remain > 0 ? cdText(remain) : '已结束'
  });
}

Page({
  data: {
    id: '',
    loading: true,          // 首屏骨架屏
    notFound: false,        // 团不存在空态
    DEFAULT_IMG,

    group: null,            // 装饰后的团
    goods: null,            // 完整商品（含 specs）
    myOrders: [],           // 我的拼团订单
    isMember: false,        // 我是否已在团中
    otherGroups: [],        // 该商品其他在拼的团

    /* 规格选择（拼团价固定 groupPrice，选规格仅影响 specText / 库存上限） */
    specSel: [],
    specText: '',
    curStock: 1,
    count: 1,

    /* 参团成功弹层 */
    showJoinSuccess: false,
    joinOrderId: '',
    joinMsg: ''
  },

  /* ==================== 生命周期 ==================== */

  onLoad(options) {
    const id = (options && options.id) || '';
    this.loaded = false;
    this._joining = false;
    this._creating = false;
    this._inviting = false;
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, notFound: true });
      return;
    }
    this.loadDetail().then(() => this.loadOtherGroups());
  },

  /** 从订单/详情等页面返回时刷新团状态（首次由 onLoad 触发，避免重复请求） */
  onShow() {
    if (this.loaded) {
      this.loadDetail().then(() => this.loadOtherGroups());
    }
  },

  onHide() {
    // ★ 清理倒计时定时器
    this.stopTimer();
  },

  onUnload() {
    // ★ 清理倒计时定时器 + loading 兜底
    this.stopTimer();
    toast.hideLoadingForce();
  },

  onPullDownRefresh() {
    this.loadDetail()
      .then(() => this.loadOtherGroups())
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  /** 遮罩禁止穿透滚动 */
  noop() {},

  /* ==================== 数据加载 ==================== */

  loadDetail() {
    return api.group.detail(this.data.id).then((res) => {
      const raw = res.data || null;
      if (!raw) {
        this.setData({ loading: false, notFound: true });
        this.loaded = true;
        return;
      }
      const group = decorateGroup(raw);
      const goods = raw.goods || null;
      const myOrders = raw.myOrders || [];
      const isMember = !!raw.isMine || myOrders.length > 0;
      this.setData({
        group,
        goods,
        myOrders,
        isMember,
        loading: false,
        notFound: false
      });
      this.initSpec(goods);
      this.loaded = true;
      this.startTimer();
    }).catch(() => {
      // http 层已 toast 错误（如"拼团不存在"）
      this.setData({ loading: false, notFound: true });
      this.loaded = true;
    });
  },

  /** 该商品其他在拼的团（同 goodsId、status=1、非本团、未过期且未满员），最多 3 条 */
  loadOtherGroups() {
    const group = this.data.group;
    if (!group) return Promise.resolve();
    return api.group.list().then((res) => {
      const d = res.data || {};
      const others = (d.groups || [])
        .filter((x) => x.goodsId === group.goodsId
          && x.status === 1
          && Number(x.id) !== Number(group.id)
          && (Number(x.remainSeconds) || 0) > 0
          && ((x.requiredCount || 0) - (x.joinedCount || 0)) > 0)
        .slice(0, 3)
        .map(decorateGroup);
      this.setData({ otherGroups: others });
    }).catch(() => {});
  },

  /* ==================== 倒计时（每秒刷新，页面级单一定时器） ==================== */

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
    const g = this.data.group;
    if (!g || g.status !== 1 || g.remainSeconds <= 0) return;
    const r = g.remainSeconds - 1;
    const patch = {
      'group.remainSeconds': r,
      'group.expired': r <= 0,
      'group.cd': format.countdown(r),
      'group.countdownText': r > 0 ? cdText(r) : '已结束'
    };
    if (r <= 0) patch['group.progressText'] = '拼团已结束';
    this.setData(patch);
  },

  /* ==================== 规格选择（内联卡片） ==================== */

  /** 默认选中每一维第一项 */
  initSpec(goods) {
    const specs = (goods && goods.specs) || [];
    if (!specs.length) {
      this.setData({ specSel: [], specText: '', curStock: 1, count: 1 });
      return;
    }
    this.applySpec(specs.map(() => 0), goods);
  },

  /** 选规格仅影响 specText / 库存上限；拼团价固定为 groupPrice */
  applySpec(specSel, goods) {
    goods = goods || this.data.goods || {};
    const specs = goods.specs || [];
    const labels = [];
    let stock = null;
    specs.forEach((dim, di) => {
      const vi = specSel[di];
      const val = dim && dim.values ? dim.values[vi] : null;
      if (val) {
        labels.push(val.label);
        if (val.stock !== undefined) stock = Number(val.stock);
      }
    });
    if (stock === null) stock = Number(goods.stock) || 1;
    stock = Math.max(1, stock);
    this.setData({
      specSel,
      specText: labels.join(' · '),
      curStock: stock,
      count: Math.max(1, Math.min(this.data.count, stock))
    });
  },

  onSelectSpec(e) {
    const di = Number(e.currentTarget.dataset.di);
    const vi = Number(e.currentTarget.dataset.vi);
    const specs = (this.data.goods && this.data.goods.specs) || [];
    const dim = specs[di];
    if (!dim || !dim.values || !dim.values[vi]) return;
    const val = dim.values[vi];
    if (val.stock !== undefined && Number(val.stock) <= 0) {
      toast.showToast('该规格暂时缺货');
      return;
    }
    const specSel = this.data.specSel.slice();
    specSel[di] = vi;
    this.applySpec(specSel);
  },

  onMinus() {
    if (this.data.count <= 1) return;
    this.setData({ count: this.data.count - 1 });
  },

  onPlus() {
    if (this.data.count >= this.data.curStock) {
      toast.showToast('超出库存');
      return;
    }
    this.setData({ count: this.data.count + 1 });
  },

  /* ==================== 参团（适配 join 新返回结构 {group, order, msg}） ==================== */

  onJoin() {
    const g = this.data.group;
    if (!g || g.status !== 1 || g.remainSeconds <= 0 || g.lack <= 0) return;
    if (this._joining) return;
    if (!this.data.specText) {
      toast.showToast('请选择规格');
      return;
    }
    toast.confirm('确认以 ' + format.formatPrice(g.groupPrice) + ' 参团并生成订单？（演示环境，不产生真实交易）', '参团确认').then((ok) => {
      if (!ok) return;
      this._joining = true;
      toast.showLoading('参团中...');
      api.group.join({
        id: this.data.id,
        specText: this.data.specText,
        count: this.data.count
      }).then((res) => {
        toast.hideLoading();
        const d = res.data || {};
        const order = d.order || null;
        const msg = d.msg || '参团成功';
        this.loadDetail().then(() => this.loadOtherGroups());
        if (order && order.id) {
          // 生成订单 → 弹"参团成功"模态（去支付 / 邀请好友）
          this.setData({ showJoinSuccess: true, joinOrderId: order.id, joinMsg: msg });
        } else {
          toast.showSuccess(msg);
        }
      }).catch(() => {
        toast.hideLoading();
        this.loadDetail();
      }).then(() => {
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

  /* ==================== 开团（再开一团 / 我要开团） ==================== */

  onCreate() {
    const g = this.data.group;
    if (!g || !g.goodsId || this._creating) return;
    toast.confirm('确认发起「' + g.name + '」新拼团并生成订单？（演示环境，不产生真实交易）', '开团确认').then((ok) => {
      if (!ok) return;
      this._creating = true;
      toast.showLoading('开团中...');
      api.group.create({
        goodsId: g.goodsId,
        specText: this.data.specText || '',
        count: this.data.count
      }).then((res) => {
        toast.hideLoading();
        const d = res.data || {};
        const ng = d.group || {};
        toast.showSuccess('开团成功，快邀请好友参团');
        if (ng.id) {
          // 跳本团新 id（redirectTo 替换当前已结束的团）
          wx.redirectTo({
            url: '/pages/group/detail?id=' + ng.id,
            fail: () => toast.showError('跳转失败')
          });
        } else {
          this.loadDetail();
        }
      }).catch(() => {
        toast.hideLoading();
      }).then(() => {
        this._creating = false;
      });
    });
  },

  /* ==================== 邀请好友得券（模拟邀请成功） ==================== */

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

  /* ==================== 其他入口 ==================== */

  /** 其他在拼的团 → 对应拼团详情 */
  onTapOther(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pages/group/detail?id=' + id,
      fail: () => toast.showError('页面不存在')
    });
  },

  /** 查看商品详情 */
  onGoGoods() {
    const g = this.data.group;
    if (!g || !g.goodsId) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + g.goodsId });
  },

  /** 我的拼团订单 → 订单详情 */
  onViewMyOrder() {
    const o = this.data.myOrders && this.data.myOrders[0];
    if (!o || !o.id) {
      toast.showToast('暂无拼团订单');
      return;
    }
    wx.navigateTo({ url: '/pages/order/detail?id=' + o.id });
  },

  /** 团不存在空态 → 拼团专区 */
  onGoGroupList() {
    wx.redirectTo({
      url: '/pages/group/group',
      fail: () => wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
    });
  },

  /* ==================== 分享裂变 ==================== */

  onShareAppMessage() {
    const g = this.data.group || {};
    const name = g.name || '好物';
    const price = format.toFixed2(g.groupPrice || 0);
    const lack = g.lack || 0;
    // 分享触发后调 share.reward（5 积分/次，每日 3 次，超限静默）
    this.grantShareReward();
    return {
      title: lack > 0
        ? '【' + price + '元拼' + name + '】还差' + lack + '人，快来帮我砍一团！'
        : '【' + price + '元拼' + name + '】已成团，快来一起拼！',
      path: '/pages/group/detail?id=' + this.data.id,
      imageUrl: g.pic || DEFAULT_IMG
    };
  },

  grantShareReward() {
    api.share.reward('group', this.data.id).then((res) => {
      if (res && res.code === 200) toast.showToast('分享成功 +5积分');
    }).catch(() => {});
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const path = e.currentTarget.dataset.path;
    if (path) this.setData({ [path]: DEFAULT_IMG });
  }
});
