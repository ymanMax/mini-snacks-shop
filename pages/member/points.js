// pages/member/points.js —— 积分中心（模块 3.4）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const RULES = [
  '购物消费 1 元 = 1 积分，自动到账',
  '每日签到可获得积分，连续签到奖励递增',
  '评价订单可获得 20 积分',
  '积分可在兑换专区兑换优惠券'
];

Page({
  data: {
    loading: true,
    points: 0,
    mall: [],
    records: [],
    current: 1,
    size: 10,
    total: 0,
    loadingMore: false,
    rules: RULES
  },

  onLoad() {
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  loadAll() {
    this.setData({ current: 1, records: [] });
    return Promise.all([
      api.getPointsInfo().then(res => this.setData({ points: res.points, loading: false }))
        .catch(() => this.setData({ loading: false })),
      api.getPointsMall().then(mall => this.setData({ mall })).catch(() => {}),
      this.fetchRecords(1)
    ]);
  },

  fetchRecords(current) {
    return api.getPointsRecords({ current, size: this.data.size }).then(res => {
      this.setData({
        records: current === 1 ? res.records : this.data.records.concat(res.records),
        total: res.total,
        current
      });
    }).catch(() => {});
  },

  loadMore() {
    const { records, total, loadingMore, current } = this.data;
    if (loadingMore || records.length >= total) return;
    this.setData({ loadingMore: true });
    this.fetchRecords(current + 1).then(() => this.setData({ loadingMore: false }));
  },

  onExchange(e) {
    const item = this.data.mall[e.currentTarget.dataset.index];
    if (this.data.points < item.points) return;
    toast.confirm('确认使用 ' + item.points + ' 积分兑换「' + item.name + '」吗？', '积分兑换').then(ok => {
      if (!ok) return;
      api.exchangePoints(item.id).then(() => {
        toast.success('兑换成功');
        this.loadAll();
      }).catch(() => {});
    });
  },

  onCheckin() {
    wx.navigateTo({ url: '/pages/member/checkin' });
  }
});
