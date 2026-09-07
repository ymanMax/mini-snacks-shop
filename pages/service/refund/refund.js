// pages/service/refund/refund.js —— 申请售后（仅退款/退货退款/换货）
const { orderApi, afterSaleApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const TYPES = [
  { type: 1, label: '仅退款', desc: '未收到货或与商家协商一致' },
  { type: 2, label: '退货退款', desc: '商品退回后退款' },
  { type: 3, label: '换货', desc: '商品问题申请更换' }
];
const REASONS = ['商品破损/变质', '少件/漏发', '商品临期', '不想要了', '配送太慢', '其他原因'];

Page({
  data: {
    orderId: null,
    order: null,
    types: TYPES,
    activeType: 1,
    reasons: REASONS,
    reasonIndex: -1,
    selected: {},
    amountText: '0.00',
    remark: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId });
    orderApi.getDetail(options.orderId).then((order) => {
      const selected = {};
      order.items.forEach((it) => { selected[it.goodsId] = true; });
      this.setData({ order, selected }, () => this.calcAmount());
    });
  },

  pickType(e) {
    this.setData({ activeType: Number(e.currentTarget.dataset.type) }, () => this.calcAmount());
  },
  pickReason(e) {
    this.setData({ reasonIndex: Number(e.currentTarget.dataset.index) });
  },
  toggleItem(e) {
    const id = Number(e.currentTarget.dataset.goodsid);
    const selected = Object.assign({}, this.data.selected);
    selected[id] = !selected[id];
    this.setData({ selected }, () => this.calcAmount());
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  calcAmount() {
    const order = this.data.order;
    if (!order) return;
    let amount = 0;
    order.items.forEach((it) => {
      if (this.data.selected[it.goodsId]) amount += it.price * it.count;
    });
    // 换货不涉及退款金额
    if (this.data.activeType === 3) amount = 0;
    this.setData({ amountText: amount.toFixed(2) });
  },

  submit() {
    if (this.data.submitting) return;
    const selectedIds = Object.keys(this.data.selected).filter((k) => this.data.selected[k]).map(Number);
    if (!selectedIds.length) return toast.showToast('请选择售后商品');
    if (this.data.reasonIndex < 0) return toast.showToast('请选择申请原因');
    const reason = REASONS[this.data.reasonIndex] + (this.data.remark ? '：' + this.data.remark : '');
    this.setData({ submitting: true });
    afterSaleApi.apply({
      orderId: this.data.orderId,
      type: this.data.activeType,
      reason,
      itemIds: selectedIds
    }).then((ticket) => {
      toast.showSuccess('售后申请已提交');
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/service/ticket-detail/ticket-detail?id=' + ticket.id });
      }, 800);
    }).catch(() => this.setData({ submitting: false }));
  }
});
