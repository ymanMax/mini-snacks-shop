// pages/message/message.js — 消息中心
// 数据统一走 api/index.js；toast 走 utils/toast.js
// 已读变化后调 getApp().refreshUnreadMessage() 同步"我的"页角标
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TYPE_TABS = [
  { label: '全部', value: 0 },
  { label: '系统', value: 1 },
  { label: '订单', value: 2 },
  { label: '促销', value: 3 },
  { label: '互动', value: 4 }
];
const TYPE_ICON = { 1: '📢', 2: '📦', 3: '🎁', 4: '💬' };

Page({
  data: {
    tabs: TYPE_TABS,
    type: 0,               // 0全部/1系统/2订单/3促销/4互动
    list: [],
    firstLoading: true
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    // 返回页面时重查（其他页面可能已读消息）
    if (!this.data.firstLoading) this.loadList();
  },

  onUnload() {
    // 同步"我的"页未读角标
    const app = getApp();
    if (app && app.refreshUnreadMessage) app.refreshUnreadMessage();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  /* ---------- 数据加载 ---------- */
  loadList() {
    return api.message.list(this.data.type).then((res) => {
      const list = (res.data || []).map((m) => Object.assign({}, m, {
        icon: TYPE_ICON[m.type] || '📢'
      }));
      this.setData({ list, firstLoading: false });
    }).catch(() => this.setData({ firstLoading: false }));
  },

  /* ---------- 类型 Tab 切换 ---------- */
  onTabChange(e) {
    const type = Number(e.currentTarget.dataset.type);
    if (type === this.data.type) return;
    this.setData({ type, firstLoading: true });
    this.loadList();
  },

  /* ---------- 点击消息：已读 + 通用 link 跳转（V1.1 优化3-5 消息跳转路由表） ---------- */
  onTapMessage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.list[index];
    if (!item) return;

    // 未读 → 已读 + 同步"我的"页角标
    if (!item.isRead) {
      api.message.read(item.id).then(() => {
        this.setData({ ['list[' + index + '].isRead']: true });
        const app = getApp();
        if (app && app.refreshUnreadMessage) app.refreshUnreadMessage();
      }).catch(() => {});
    }

    // link 非空优先；订单消息无 link 时兜底跳订单详情
    const link = item.link || (item.type === 2 && item.relatedId ? '/pages/order/detail?id=' + item.relatedId : '');
    if (!link) return;
    const tabPages = ['/pages/index/index', '/pages/classic/classic', '/pages/cart/cart', '/pages/mine/mine'];
    if (tabPages.some((p) => link.indexOf(p) === 0)) {
      wx.switchTab({ url: link });
    } else {
      wx.navigateTo({ url: link, fail: () => toast.showError('页面不存在') });
    }
  },

  /* ---------- 全部已读 ---------- */
  onReadAll() {
    toast.showLoading('处理中...');
    api.message.readAll().then(() => {
      toast.hideLoading();
      toast.showSuccess('已全部标记为已读');
      this.loadList();
      const app = getApp();
      if (app && app.refreshUnreadMessage) app.refreshUnreadMessage();
    }).catch(() => toast.hideLoading());
  }
});
