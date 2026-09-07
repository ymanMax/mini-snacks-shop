// pages/member/points/points.js —— 积分卡 / 兑换专区 / 明细分页 / 规则
const { pointsApi, memberApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');
const { pointsRules } = require('../../../mock/data/points.js');

Page({
  data: {
    points: 0,
    exchangeItems: [],
    records: [],
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden',
    loading: true,
    rules: pointsRules,
    showRules: false
  },

  onLoad() {
    this.loadExchange();
    this.loadRecords(true);
  },

  onShow() {
    memberApi.getInfo().then((m) => this.setData({ points: m.user.points }));
  },

  loadExchange() {
    pointsApi.getExchangeItems().then((list) => this.setData({ exchangeItems: list }));
  },

  loadRecords(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading', loading: reset });
    pointsApi.getRecords({ current: page, size: this.data.size }).then((res) => {
      const list = reset ? res.records : this.data.records.concat(res.records);
      this.setData({
        records: list,
        total: res.total,
        page: page + 1,
        loading: false,
        loadStatus: list.length >= res.total ? 'nomore' : 'hidden'
      });
    }).catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  onReachBottom() {
    if (this.data.records.length < this.data.total) this.loadRecords(false);
  },

  doExchange(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.exchangeItems.find((x) => x.id === id);
    if (!item) return;
    if (this.data.points < item.points) {
      toast.showToast('积分不足，再攒攒吧');
      return;
    }
    toast.showModal(`确认消耗 ${item.points} 积分兑换「${item.name}」吗？`, '积分兑换').then((ok) => {
      if (!ok) return;
      pointsApi.exchange(id).then((res) => {
        toast.showSuccess('兑换成功');
        this.setData({ points: res.points });
        this.loadRecords(true);
      });
    });
  },

  toggleRules() {
    this.setData({ showRules: !this.data.showRules });
  },
  noop() {}
});
