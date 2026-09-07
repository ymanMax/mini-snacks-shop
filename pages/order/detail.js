// pages/order/detail.js —— 订单详情页（优化 7.2）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const STATUS_MAP = {
  1: { text: '待付款', tip: '请尽快完成支付，超时订单将自动取消' },
  2: { text: '待发货', tip: '商家正在备货中，请耐心等待' },
  3: { text: '配送中', tip: '骑手正在火速配送中，请保持电话畅通' },
  4: { text: '待收货', tip: '商品已送达，请确认收货' },
  5: { text: '已完成', tip: '交易完成，感谢您的购买' },
  6: { text: '已取消', tip: '订单已取消' }
};

// 售后工单状态：1橙 2蓝 3绿 4红 5灰
const AFTERSALE_STATUS = {
  1: { text: '待审核', cls: 'as-orange' },
  2: { text: '处理中', cls: 'as-blue' },
  3: { text: '已完成', cls: 'as-green' },
  4: { text: '已拒绝', cls: 'as-red' },
  5: { text: '已撤销', cls: 'as-gray' }
};

Page({
  data: {
    loading: true,
    order: null,
    statusText: '',
    statusTip: '',
    timeline: [],
    aftersale: null   // 该订单的售后工单（最新一条）
  },

  onLoad(options) {
    this._id = (options || {}).id;
    if (!this._id) {
      toast.showToast('订单参数缺失');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      return;
    }
    this._skipShow = true; // 跳过 onLoad 后的首次 onShow
    this.loadDetail();
  },

  onShow() {
    // 从评价页返回时刷新（订单可能已标记已评价）
    if (this._skipShow) {
      this._skipShow = false;
      return;
    }
    if (this._id) this.loadDetail(true);
  },

  loadDetail(silent) {
    if (!silent) this.setData({ loading: true });
    return api.getOrderDetail(this._id).then(o => {
      const st = STATUS_MAP[o.status] || { text: '未知状态', tip: '' };
      this.setData({
        order: o,
        statusText: st.text,
        statusTip: st.tip,
        timeline: (o.timeline || []).slice().reverse()
      });
      this.loadAftersale();
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 查询该订单的售后工单（有则展示状态卡片）
  loadAftersale() {
    api.getAftersaleByOrder(this._id).then(list => {
      const t = (list || [])[0];
      if (!t) {
        this.setData({ aftersale: null });
        return;
      }
      const st = AFTERSALE_STATUS[t.status] || { text: '未知', cls: 'as-gray' };
      this.setData({
        aftersale: Object.assign({}, t, { statusText: st.text, statusClass: st.cls })
      });
    }).catch(() => {});
  },

  goAftersaleApply() {
    wx.navigateTo({ url: '/pages/service/apply?orderId=' + this._id });
  },

  goAftersaleList() {
    wx.navigateTo({ url: '/pages/service/aftersale' });
  },

  // ===== 操作 =====
  cancelOrder() {
    toast.confirm('确认取消该订单吗？').then(ok => {
      if (!ok) return;
      api.cancelOrder(this._id).then(() => {
        toast.success('订单已取消');
        this.loadDetail(true);
      }).catch(() => {});
    });
  },

  payOrder() {
    if (this._paying) return;
    this._paying = true;
    wx.showLoading({ title: '支付中...', mask: true });
    setTimeout(() => {
      api.payOrder(this._id).then(() => {
        wx.hideLoading();
        toast.success('支付成功');
        this.loadDetail(true);
      }).catch(() => {
        wx.hideLoading();
      }).finally(() => {
        this._paying = false;
      });
    }, 2000);
  },

  remindOrder() {
    toast.showToast('已提醒商家发货');
  },

  confirmOrder() {
    toast.confirm('确认已收到商品吗？').then(ok => {
      if (!ok) return;
      api.confirmOrder(this._id).then(() => {
        toast.success('已确认收货');
        this.loadDetail(true);
      }).catch(() => {});
    });
  },

  goReview() {
    wx.navigateTo({ url: '/pages/order/review?orderId=' + this._id });
  },

  rebuy() {
    api.rebuyOrder(this._id).then(() => {
      getApp().refreshCartBadge();
      toast.success('已加入购物车');
    }).catch(() => {});
  },

  // 模拟配送进度（演示）
  advanceOrder() {
    api.advanceOrder(this._id).then(() => {
      toast.showToast('配送进度已推进');
      this.loadDetail(true);
    }).catch(() => {});
  },

  callRider() {
    const rider = this.data.order && this.data.order.rider;
    if (!rider) return;
    const phone = String(rider.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 11) {
      toast.showToast('演示环境，无法拨打电话');
      return;
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => toast.showToast('演示环境，无法拨打电话')
    });
  },

  copyOrderNo() {
    const order = this.data.order;
    if (!order) return;
    wx.setClipboardData({ data: order.orderNo });
  },

  goGoods(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  // ===== 图片兜底 =====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'order.items'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
