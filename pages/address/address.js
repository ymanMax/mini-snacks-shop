// pages/address/address.js —— 地址列表页（重写）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { add } = require('../../utils/format.js');

const TAGS = ['全部', '家', '公司', '学校'];

Page({
  data: {
    loading: true,
    list: [],
    tags: TAGS,
    activeTag: '全部',
    hasAny: false,
    from: '',        // from=confirm 时点击地址卡回传选中
    amount: 0,       // confirm 传入的商品总额（用于配送费预估）
    rule: null,
    freeThreshold: 59,
    maxKm: 5
  },

  onLoad(options) {
    const opts = options || {};
    this.setData({
      from: opts.from || '',
      amount: Number(opts.amount) || 0
    });
    // 配送规则只拉一次，前端预估配送费 / 配送范围
    this._ruleReady = api.getDeliveryRule().then(res => {
      this.setData({
        rule: res.rule,
        freeThreshold: res.freeThreshold,
        maxKm: res.maxKm
      });
    }).catch(() => {});
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    return Promise.all([api.getAddressList(), this._ruleReady || Promise.resolve()])
      .then(results => {
        const list = results[0] || [];
        // 默认地址永远排最前
        this._all = list.slice().sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        this.applyFilter();
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  chooseTag(e) {
    this.setData({ activeTag: e.currentTarget.dataset.tag });
    this.applyFilter();
  },

  // 标签筛选 + confirm 模式的配送费/范围计算
  applyFilter() {
    const { activeTag, amount, rule, freeThreshold, maxKm } = this.data;
    const all = this._all || [];
    const list = all
      .filter(a => activeTag === '全部' || a.tag === activeTag)
      .map(a => {
        const km = a.distanceKm != null ? Number(a.distanceKm) : null;
        const outOfRange = km != null && km > maxKm;
        // freight = amount >= freeThreshold ? 0 : baseFee + max(0, ceil(km-baseKm)) * perKmFee
        let freightText = '';
        if (!outOfRange && rule && km != null && amount > 0) {
          const freight = amount >= freeThreshold
            ? 0
            : add(rule.baseFee, Math.max(0, Math.ceil(km - rule.baseKm)) * rule.perKmFee);
          freightText = freight.toFixed(2);
        }
        return Object.assign({}, a, { outOfRange, freightText });
      });
    this.setData({ list, hasAny: all.length > 0 });
  },

  // 点击地址卡：confirm 来源则回传选中并返回
  tapAddress(e) {
    if (this.data.from !== 'confirm') return;
    const item = this.data.list[e.currentTarget.dataset.index];
    if (!item) return;
    if (item.outOfRange) {
      toast.showToast('该地址超出 ' + this.data.maxKm + 'km 配送范围');
      return;
    }
    wx.setStorageSync('selected_address_id', item.id);
    wx.navigateBack({ delta: 1 });
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    api.setDefaultAddress(id).then(() => {
      toast.success('已设为默认地址');
      this.loadList();
    }).catch(() => {});
  },

  editAddress(e) {
    wx.navigateTo({ url: '/pages/newAddress/newAddress?id=' + e.currentTarget.dataset.id });
  },

  delAddress(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('确认删除该收货地址吗？').then(ok => {
      if (!ok) return;
      api.deleteAddress(id).then(() => {
        toast.success('已删除');
        this.loadList();
      }).catch(() => {});
    });
  },

  addAddress() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress' });
  },

  noop() {},

  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
