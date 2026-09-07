// pages/message/index/index.js —— 消息通知（类型分组 / 全部已读 / 路由跳转表）
const { messageApi } = require('../../../api/index.js');

const TYPES = [
  { type: 0, label: '全部' },
  { type: 2, label: '订单' },
  { type: 3, label: '促销' },
  { type: 1, label: '系统' },
  { type: 4, label: '互动' }
];

Page({
  data: {
    types: TYPES,
    active: 0,
    records: []
  },

  onShow() {
    this.load(this.data.active);
  },

  switchTab(e) {
    const type = Number(e.currentTarget.dataset.type);
    this.setData({ active: type });
    this.load(type);
  },

  load(type) {
    messageApi.getList(type).then((res) => {
      this.setData({ records: res.records });
    });
  },

  // 消息类型 → 路由跳转表
  openMsg(e) {
    const { id, related, type, biz } = e.currentTarget.dataset;
    messageApi.read(id).then(() => this.load(this.data.active));

    const b = biz || '';
    let url = '';
    if (b === 'order' || (Number(type) === 2 && related)) {
      url = '/pages/order/detail/detail?id=' + related;
    } else if (b === 'group') {
      url = '/pages/group/detail/detail?id=' + related;
    } else if (b === 'goods' && related) {
      url = '/pages/detail/detail?product_id=' + related;
    } else if (b === 'coupon') {
      url = '/pages/coupon/mine/mine';
    } else if (Number(type) === 3) {
      url = '/pages/promotion/index/index';
    } else if (Number(type) === 4 && related) {
      url = '/pages/order/list/list?status=5';
    }
    if (url) wx.navigateTo({ url, fail: () => {} });
  },

  readAll() {
    messageApi.read('').then(() => this.load(this.data.active));
  }
});
