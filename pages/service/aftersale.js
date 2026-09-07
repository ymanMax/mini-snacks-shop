// pages/service/aftersale.js —— 售后工单列表页
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

// 售后状态：1橙待审核 2蓝处理中 3绿已完成 4红已拒绝 5灰已撤销
const STATUS_MAP = {
  1: { text: '待审核', cls: 'as-orange' },
  2: { text: '处理中', cls: 'as-blue' },
  3: { text: '已完成', cls: 'as-green' },
  4: { text: '已拒绝', cls: 'as-red' },
  5: { text: '已撤销', cls: 'as-gray' }
};

Page({
  data: {
    loading: true,
    list: [],
    current: 1,
    size: 10,
    total: 0,
    noMore: false,
    loadingMore: false
  },

  onLoad() {
    this._skipShow = true;
    this.reload();
  },

  onShow() {
    // 从申请页/订单详情返回时刷新（可能新增/变更了工单）
    if (this._skipShow) {
      this._skipShow = false;
      return;
    }
    this.reload(true);
  },

  onPullDownRefresh() {
    this.reload(true);
  },

  onReachBottom() {
    const { noMore, loadingMore, loading, current } = this.data;
    if (noMore || loadingMore || loading) return;
    this.loadPage(current + 1, true);
  },

  reload(silent) {
    this.setData({ current: 1, noMore: false });
    return this.loadPage(1, silent);
  },

  loadPage(current, silent) {
    if (!silent && current === 1) this.setData({ loading: true });
    if (current > 1) this.setData({ loadingMore: true });
    return api.getAftersaleList({ current, size: this.data.size })
      .then(res => {
        const records = (res.records || []).map(t => this.decorate(t));
        const list = current === 1 ? records : this.data.list.concat(records);
        this.setData({
          list,
          total: res.total,
          current,
          noMore: records.length < this.data.size || list.length >= res.total
        });
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ loading: false, loadingMore: false });
        wx.stopPullDownRefresh();
      });
  },

  decorate(t) {
    const st = STATUS_MAP[t.status] || { text: '未知', cls: 'as-gray' };
    return Object.assign({}, t, {
      statusText: st.text,
      statusClass: st.cls,
      expanded: false,
      timelineDesc: (t.timeline || []).slice().reverse()
    });
  },

  // 展开/收起进度时间线
  toggleTimeline(e) {
    const i = Number(e.currentTarget.dataset.index);
    this.setData({ [`list[${i}].expanded`]: !this.data.list[i].expanded });
  },

  // 撤销申请（仅待审核）
  cancelTicket(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('确认撤销该售后申请吗？').then(ok => {
      if (!ok) return;
      api.cancelAftersale(id).then(() => {
        toast.success('已撤销');
        this.reload(true);
      }).catch(() => {});
    });
  },

  // 模拟处理进度（演示）
  advanceTicket(e) {
    const id = e.currentTarget.dataset.id;
    api.advanceAftersale(id).then(() => {
      toast.showToast('处理进度已推进');
      this.reload(true);
    }).catch(() => {});
  },

  // 跳订单详情
  goOrder(e) {
    wx.navigateTo({ url: '/pages/order/detail?id=' + e.currentTarget.dataset.oid });
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
