// pages/member/points/points.js — 积分中心
// Tab：积分明细（分页）/ 兑换专区；数据统一走 api/index.js
const api = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';

/** 类型图标（type：1购物 / 2签到 / 3评价 / 4兑换消耗 / 5生日赠送） */
const TYPE_ICON = { 1: '🛍️', 2: '📅', 3: '⭐', 4: '🎁', 5: '🎂' };

Page({
  data: {
    activeTab: 'detail', // detail 积分明细 | exchange 兑换专区

    // 顶部积分卡
    totalPoints: 0,

    // 积分明细分页
    records: [],
    current: 1,
    size: 10,
    total: 0,
    hasMore: true,
    listLoading: false,
    typeText: {},

    // 兑换专区
    exchangeGoods: [],
    exchangeRules: [],

    firstLoading: true
  },

  onLoad() {
    this.loadFirst();
  },

  onShow() {
    // 从签到页返回同步积分
    if (!this.data.firstLoading) {
      this.refreshCurrentTab();
    }
  },

  onPullDownRefresh() {
    this.refreshCurrentTab().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.activeTab === 'detail' && this.data.hasMore && !this.data.listLoading) {
      this.loadRecords(this.data.current + 1);
    }
  },

  /** 首次加载：明细第一页 + 兑换列表（骨架屏） */
  loadFirst() {
    return Promise.all([
      this.loadRecords(1),
      this.loadExchange()
    ]).then(() => {
      this.setData({ firstLoading: false });
    }).catch(() => {
      this.setData({ firstLoading: false });
    });
  },

  refreshCurrentTab() {
    if (this.data.activeTab === 'exchange') {
      return this.loadExchange();
    }
    return this.loadRecords(1);
  },

  /** 积分明细分页 */
  loadRecords(current) {
    if (this.data.listLoading) return Promise.resolve();
    this.setData({ listLoading: true });
    return api.points.page({ current, size: this.data.size }).then((res) => {
      const d = res.data || {};
      const records = (d.records || []).map((r) => Object.assign({}, r, {
        icon: TYPE_ICON[r.type] || '🪙',
        positive: Number(r.points) > 0,
        pointsText: (Number(r.points) > 0 ? '+' : '') + r.points
      }));
      const merged = current === 1 ? records : this.data.records.concat(records);
      this.setData({
        records: merged,
        current: d.current || current,
        total: d.total || 0,
        totalPoints: d.totalPoints !== undefined ? d.totalPoints : this.data.totalPoints,
        typeText: d.typeText || this.data.typeText,
        hasMore: merged.length < (d.total || 0),
        listLoading: false
      });
    }).catch(() => {
      this.setData({ listLoading: false });
    });
  },

  /** 兑换专区列表 */
  loadExchange() {
    return api.points.exchangeList().then((res) => {
      const d = res.data || {};
      const totalPoints = d.totalPoints !== undefined ? d.totalPoints : this.data.totalPoints;
      const goods = (d.goods || []).map((g) => Object.assign({}, g, {
        img: g.pic || DEFAULT_IMG,
        enough: totalPoints >= g.points && g.stock > 0
      }));
      this.setData({
        exchangeGoods: goods,
        exchangeRules: d.rules || [],
        totalPoints
      });
    }).catch(() => {});
  },

  /** Tab 切换 */
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    this.refreshCurrentTab();
  },

  /** 兑换：confirm → api.points.exchange(id) → toast data.msg → 刷新 */
  onExchange(e) {
    const id = e.currentTarget.dataset.id;
    const goods = this.data.exchangeGoods.find((g) => g.id === id);
    if (!goods) return;
    if (goods.stock <= 0) {
      toast.showError('已被兑完');
      return;
    }
    if (this.data.totalPoints < goods.points) {
      toast.showError('积分不足，去签到/购物赚积分吧');
      return;
    }
    toast.confirm('确认用 ' + goods.points + ' 积分兑换「' + goods.name + '」？', '积分兑换').then((ok) => {
      if (!ok) return;
      toast.showLoading('兑换中...');
      return api.points.exchange(id).then((res) => {
        toast.hideLoading();
        const d = res.data || {};
        toast.showSuccess(d.msg || '兑换成功');
        if (d.totalPoints !== undefined) this.setData({ totalPoints: d.totalPoints });
        // 刷新积分与兑换列表（库存变化）
        this.loadExchange();
      });
    }).catch(() => toast.hideLoading());
  },

  onGoCheckin() {
    wx.navigateTo({ url: '/pages/member/checkin/checkin' });
  },

  /** 图片兜底 */
  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.exchangeGoods.findIndex((g) => g.id === id);
    if (idx > -1) {
      this.setData({ ['exchangeGoods[' + idx + '].img']: DEFAULT_IMG });
    }
  }
});
