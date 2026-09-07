// pages/service/ticket-detail/ticket-detail.js —— 工单状态跟踪 / 推进 / 客服评价
const { afterSaleApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

Page({
  data: {
    id: null,
    ticket: null,
    showRate: false,
    speed: 5,
    solve: 5,
    content: ''
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.load();
  },

  onShow() {
    if (this.data.id) this.load();
  },

  load() {
    afterSaleApi.getDetail(this.data.id).then((ticket) => {
      this.setData({ ticket });
    });
  },

  // 模拟处理进度：待处理 → 处理中 → 已完成
  advance() {
    afterSaleApi.advance(this.data.id).then(() => {
      toast.showSuccess('状态已更新');
      this.load();
    });
  },

  cancel() {
    toast.showModal('确定撤回该售后申请吗？', '撤销售后').then((ok) => {
      if (!ok) return;
      afterSaleApi.cancel(this.data.id).then(() => {
        toast.showSuccess('已撤回');
        this.load();
      });
    });
  },

  contact() {
    wx.navigateTo({ url: '/pages/service/chat/chat' });
  },

  openRate() {
    this.setData({ showRate: true });
  },
  noop() {},
  setSpeed(e) {
    this.setData({ speed: Number(e.currentTarget.dataset.score) });
  },
  setSolve(e) {
    this.setData({ solve: Number(e.currentTarget.dataset.score) });
  },
  onContent(e) {
    this.setData({ content: e.detail.value });
  },
  submitRate() {
    afterSaleApi.rate(this.data.id, {
      speed: this.data.speed,
      solve: this.data.solve,
      content: this.data.content
    }).then((res) => {
      toast.showSuccess('评价成功，积分 +' + res.points);
      this.setData({ showRate: false });
      this.load();
    });
  }
});
