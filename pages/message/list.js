// pages/message/list.js —— 消息中心
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TYPE_MAP = {
  1: { icon: '🔔', cls: 'blue', name: '系统' },
  2: { icon: '📦', cls: 'red', name: '订单' },
  3: { icon: '🎉', cls: 'orange', name: '促销' },
  4: { icon: '💬', cls: 'green', name: '互动' }
};

const TABS = [
  { label: '全部', type: 0 },
  { label: '系统', type: 1 },
  { label: '订单', type: 2 },
  { label: '促销', type: 3 },
  { label: '互动', type: 4 }
];

// relatedType 跳转路由表（契约附录）
function buildRoute(item) {
  switch (item.relatedType) {
    case 'order':
      return item.relatedId ? '/pages/order/detail?id=' + item.relatedId : '';
    case 'coupon':
      return '/pages/coupon/center?tab=mine';
    case 'group':
      return item.relatedId ? '/pages/group/detail?id=' + item.relatedId : '';
    case 'aftersale':
      return '/pages/service/aftersale';
    case 'seckill':
      return '/pages/seckill/index';
    default:
      return '';
  }
}

Page({
  data: {
    loading: true,
    tabs: TABS,
    activeType: 0,
    list: [],        // 当前类型筛选后的展示列表
    hasAny: false,
    current: 1,
    size: 10,
    total: 0,
    loadingMore: false,
    unread: 0
  },

  onLoad() {
    this._records = [];
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  refresh() {
    this.setData({ current: 1 });
    return Promise.all([
      this.fetch(1),
      api.getUnreadCount().then(n => this.setData({ unread: n })).catch(() => {})
    ]);
  },

  fetch(current) {
    return api.getMessages({ current, size: this.data.size }).then(res => {
      const records = res.records.map(m => Object.assign({}, m, TYPE_MAP[m.type] || TYPE_MAP[1]));
      this._records = current === 1 ? records : this._records.concat(records);
      this.setData({ total: res.total, current, loading: false });
      this.applyFilter();
    }).catch(() => this.setData({ loading: false }));
  },

  // 类型分组：对已加载的 records 做客户端过滤
  applyFilter() {
    const type = this.data.activeType;
    const list = type === 0 ? this._records.slice() : this._records.filter(m => m.type === type);
    this.setData({ list, hasAny: this._records.length > 0 });
  },

  switchTab(e) {
    const type = Number(e.currentTarget.dataset.type);
    if (type === this.data.activeType) return;
    this.setData({ activeType: type });
    this.applyFilter();
  },

  loadMore() {
    const { total, loadingMore, current } = this.data;
    if (loadingMore || this._records.length >= total) return;
    this.setData({ loadingMore: true });
    this.fetch(current + 1).then(() => this.setData({ loadingMore: false }));
  },

  onTapMessage(e) {
    const item = this.data.list[e.currentTarget.dataset.index];
    if (!item) return;
    if (!item.isRead) {
      api.readMessage(item.id).then(() => {
        const idx = this._records.findIndex(m => m.id === item.id);
        if (idx > -1) this._records[idx].isRead = true;
        this.setData({ unread: Math.max(0, this.data.unread - 1) });
        this.applyFilter();
      }).catch(() => {});
    }
    const url = buildRoute(item);
    if (url) wx.navigateTo({ url });
  },

  onImgError() {},

  onReadAll() {
    if (!this.data.unread) {
      toast.showToast('没有未读消息');
      return;
    }
    api.readAllMessages().then(() => {
      toast.success('已全部标记已读');
      this.refresh();
    }).catch(() => {});
  }
});
