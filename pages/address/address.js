// pages/address/address.js — 收货地址列表（V1.1 优化2 增强）
// 数据统一走 api/index.js；toast/confirm 走 utils/toast.js
// 支持选择模式：?select=1 时点击地址卡写入 storage('selectedAddress') 并返回
// 新增：标签筛选（全部/家/学校/公司）、超范围标识与拦截、距离 + 预估配送费展示
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

// 配送费规则默认值（与 mock shop.deliveryRule 一致），meta 拉取成功后覆盖
const DEFAULT_RULE = { baseFee: 5, baseKm: 3, perKmFee: 1, maxKm: 60 };
const TABS = ['全部', '家', '学校', '公司'];

Page({
  data: {
    selectMode: false,   // 选择模式（订单确认页跳入）
    firstLoading: true,  // 首次加载骨架屏

    tabs: TABS,
    activeTag: '全部',   // 当前标签筛选

    list: [],            // 全量地址（已附带 estFreight 展示字段，默认地址置顶由接口保证）
    viewList: [],        // 按 activeTag 过滤后的展示列表

    freeHint: '',        // 满免门槛文案，如「满49免基础配送费（金卡会员）」
    maxKm: DEFAULT_RULE.maxKm
  },

  onLoad(options) {
    // 选择模式：订单确认页跳入（?select=1），点击地址卡即选中返回
    this.setData({ selectMode: !!(options && options.select === '1') });
    this.freightRule = Object.assign({}, DEFAULT_RULE);
    this.loadMeta();
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  /* ---------- 配送规则 / 会员门槛（用于预估配送费与满免文案） ---------- */
  loadMeta() {
    // freight 接口返回 level 调整后的 freeThreshold + 完整 rule；member 提供等级名
    return Promise.all([
      api.shop.freight({ amount: 0, distanceKm: 0 }).catch(() => null),
      api.member.info().catch(() => null)
    ]).then((arr) => {
      const fr = arr[0] && arr[0].data;
      const mem = arr[1] && arr[1].data;
      const rule = (fr && fr.rule) || DEFAULT_RULE;
      this.freightRule = Object.assign({}, DEFAULT_RULE, rule);
      const freeThreshold = (fr && fr.freeThreshold) || (mem && mem.freeShipThreshold) || rule.freeThreshold || 59;
      const levelName = (mem && mem.levelName) || '';
      const maxKm = this.freightRule.maxKm || DEFAULT_RULE.maxKm;
      this.setData({
        maxKm,
        freeHint: '满' + freeThreshold + '免基础配送费' + (levelName ? '（' + levelName + '）' : '')
      });
      // 规则到位后按最新 rule 重算一次预估配送费
      if (this.data.list.length) {
        this.setData({ list: this.decorate(this.data.list) });
        this.applyFilter();
      }
    });
  },

  /** 前端预估配送费：amount 未知按 0 计 → 基础费不免；baseFee + max(0, ceil(km-baseKm)) * perKmFee */
  estFreight(km) {
    const r = this.freightRule || DEFAULT_RULE;
    const extraKm = Math.max(0, Math.ceil((Number(km) || 0) - r.baseKm));
    return Math.round((r.baseFee + extraKm * r.perKmFee) * 100) / 100;
  },

  /** 为地址附加展示字段（预估配送费） */
  decorate(list) {
    return (list || []).map((a) => Object.assign({}, a, { estFreight: this.estFreight(a.distanceKm) }));
  },

  /* ---------- 数据加载 ---------- */
  loadList() {
    return api.address.list().then((res) => {
      const list = this.decorate(res.data || []);
      this.setData({ list, firstLoading: false });
      this.applyFilter();
    }).catch(() => {
      this.setData({ firstLoading: false });
    });
  },

  /* ---------- 标签筛选 ---------- */
  applyFilter() {
    const list = this.data.list;
    const tag = this.data.activeTag;
    const viewList = tag === '全部' ? list.slice() : list.filter((a) => a.tag === tag);
    this.setData({ viewList });
  },

  onTabTap(e) {
    const tag = e.currentTarget.dataset.tag;
    if (tag === this.data.activeTag) return;
    this.setData({ activeTag: tag });
    this.applyFilter();
  },

  /* ---------- 选择模式：点击卡片选中并返回（超范围拦截） ---------- */
  onPick(e) {
    if (!this.data.selectMode) return;
    const index = Number(e.currentTarget.dataset.index);
    const addr = this.data.viewList[index];
    if (!addr) return;
    if (addr.outOfRange) {
      toast.showToast('该地址暂不支持配送（超出' + this.data.maxKm + '公里范围）');
      return;
    }
    wx.setStorageSync('selectedAddress', addr);
    wx.navigateBack();
  },

  /* ---------- 新增 / 编辑 ---------- */
  onAdd() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress' });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/newAddress/newAddress?id=' + id });
  },

  /* ---------- 删除 ---------- */
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('确定删除该收货地址吗？', '删除地址').then((ok) => {
      if (!ok) return;
      toast.showLoading('删除中...');
      api.address.remove(id).then((res) => {
        toast.hideLoading();
        this.setData({ list: this.decorate(res.data || []) });
        this.applyFilter();
        toast.showSuccess('删除成功');
      }).catch(() => toast.hideLoading());
    });
  },

  /* ---------- 设为默认 ---------- */
  onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    toast.showLoading('设置中...');
    api.address.setDefault(id).then((res) => {
      toast.hideLoading();
      this.setData({ list: this.decorate(res.data || []) });
      this.applyFilter();
      toast.showSuccess('已设为默认地址');
    }).catch(() => toast.hideLoading());
  }
});
