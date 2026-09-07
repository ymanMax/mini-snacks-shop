// pages/order/detail.js
// 订单详情页：状态头部 / 配送 timeline / 骑手 / 地址快照 / 商品清单 / 金额明细 / 订单信息 / 底部操作栏
// 兼容入参：?id=订单id 或 ?orderNo=订单号；?justCreated=1 时突出「去支付」
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const app = getApp();
const DEFAULT_IMG = '/static/images/default.png';

/** 各状态描述文案 */
const STATUS_DESC = {
  1: '请尽快完成支付（演示环境，不产生真实交易）',
  2: '支付成功，门店正在为您分拣备货',
  3: '骑手正在飞奔向您',
  4: '商品已送达附近站点，即将为您派送',
  5: '订单已完成，欢迎再次光临',
  6: '订单已取消'
};

const PAY_TYPE_TEXT = { 1: '微信支付', 2: '货到付款' };

/** 模拟配送进度演示按钮的下一步说明 */
const ADVANCE_TIP = {
  2: '点击后订单将推进为「配送中」',
  3: '点击后订单将推进为「待收货」',
  4: '点击后订单将推进为「已完成」'
};

/**
 * 售后入口判定（V1.1 优化4）
 * - 可申请：订单状态 2/3/4/5，且无 afterSale 或 afterSale.status ∈ {4 已拒绝, 5 已撤销}
 * - 处理中：afterSale.status ∈ {1 待审核, 2 处理中, 3 已完成} → 展示「售后处理中 >」跳工单详情
 * @returns {{canAfterSale:boolean, afterSaleOngoing:boolean, afterSaleTicketId:string}}
 */
function afterSaleEntry(order) {
  const status = Number(order && order.status) || 0;
  const as = (order && order.afterSale) || null;
  const asStatus = as ? Number(as.status) || 0 : 0;
  const ticketId = as && as.ticketId ? String(as.ticketId) : '';
  const paid = status >= 2 && status <= 5;
  const ongoing = !!as && (asStatus === 1 || asStatus === 2 || asStatus === 3);
  const canApply = paid && !ongoing && (!as || asStatus === 4 || asStatus === 5);
  return {
    canAfterSale: canApply,
    afterSaleOngoing: paid && ongoing,
    afterSaleTicketId: ticketId
  };
}

Page({
  data: {
    loading: true,
    id: '',
    justCreated: false,
    order: null,
    timeline: [], // 倒序（最新在前），首节点高亮
    statusDesc: '',
    payTypeText: '',
    advanceTip: '',
    showFooter: false,
    canAdvance: false, // 状态 2/3/4 显示「模拟配送进度」演示按钮
    canAfterSale: false, // 状态 2~5 且无进行中售后 → 显示「申请售后」
    afterSaleOngoing: false, // 售后进行中 → 显示「售后处理中 >」
    afterSaleTicketId: '',
    totalPieces: 0
  },

  onLoad(options) {
    const o = options || {};
    const id = o.id || o.orderNo || '';
    this.loaded = false;
    this.paying = false;
    this.setData({
      id,
      justCreated: String(o.justCreated) === '1'
    });
    this.loadDetail();
  },

  /** 从商品详情等页面返回时刷新（首次由 onLoad 触发，避免重复请求） */
  onShow() {
    if (this.loaded) this.loadDetail();
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /* ==================== 数据加载 ==================== */

  loadDetail() {
    if (!this.data.id) {
      this.setData({ loading: false });
      return Promise.resolve();
    }
    return api.order
      .detail(this.data.id)
      .then((res) => {
        const order = (res && res.data) || null;
        if (!order) {
          this.setData({ loading: false });
          return;
        }
        // timeline 倒序展示：最新节点在顶部并主题色高亮
        const timeline = (order.timeline || [])
          .slice()
          .reverse()
          .map((t, i) => Object.assign({}, t, { latest: i === 0 }));

        let totalPieces = 0;
        (order.items || []).forEach((it) => {
          totalPieces += Number(it.count) || 0;
        });

        const status = Number(order.status);
        this.setData(Object.assign({
          // 接口返回的 order.id 一定是数字主键（orderNo 入参时也以此为准）
          order: Object.assign({}, order, {
            fullAddress: this.buildAddress(order.addressSnapshot)
          }),
          timeline,
          totalPieces,
          statusDesc: STATUS_DESC[status] || '',
          payTypeText: PAY_TYPE_TEXT[order.payType] || '微信支付',
          advanceTip: ADVANCE_TIP[status] || '',
          canAdvance: status === 2 || status === 3 || status === 4,
          showFooter: status >= 1 && status <= 5,
          loading: false
        }, afterSaleEntry(order)));
        // 支付/操作成功后回到本页时不再保持「刚下单」高亮
        if (status !== 1 && this.data.justCreated) this.setData({ justCreated: false });
      })
      .catch(() => {
        this.setData({ loading: false });
      })
      .then(() => {
        this.loaded = true;
      });
  },

  buildAddress(a) {
    if (!a) return '';
    if (a.full) return a.full;
    return (a.province || '') + (a.city || '') + (a.district || '') + (a.detail || '');
  },

  /** 操作成功后重新拉取详情 */
  reload() {
    return this.loadDetail();
  },

  /* ==================== 底部操作 ==================== */

  /** 去支付：Mock 支付（2 秒 loading → api.order.pay） */
  onPay() {
    const id = this.opId();
    if (!id || this.paying) return;
    this.paying = true;
    toast.showLoading('支付中...');
    // 演示环境，不产生真实交易
    setTimeout(() => {
      api.order
        .pay(id)
        .then(() => {
          toast.hideLoading();
          this.paying = false;
          toast.showSuccess('支付成功，演示环境不产生真实交易');
          this.reload();
        })
        .catch(() => {
          toast.hideLoading();
          this.paying = false;
        });
    }, 2000);
  },

  /** 取消订单 */
  onCancel() {
    const id = this.opId();
    if (!id) return;
    toast
      .confirm('确定取消该订单吗？', '取消订单')
      .then((ok) => {
        if (!ok) return null;
        toast.showLoading('处理中...');
        return api.order
          .cancel(id)
          .then(() => {
            toast.hideLoading();
            toast.showSuccess('订单已取消');
            this.reload();
          })
          .catch(() => toast.hideLoading());
      })
      .catch(() => {});
  },

  /** 提醒发货 */
  onRemind() {
    toast.showToast('已提醒商家尽快发货');
  },

  /** 确认收货：3/4 → 5，赠积分 */
  onConfirmReceive() {
    const id = this.opId();
    if (!id) return;
    toast
      .confirm('确认已收到商品吗？确认后订单完成', '确认收货')
      .then((ok) => {
        if (!ok) return null;
        toast.showLoading('处理中...');
        return api.order
          .confirm(id)
          .then((res) => {
            toast.hideLoading();
            const points = (res && res.data && res.data.points) || 0;
            toast.showSuccess('确认收货成功，积分+' + points);
            this.reload();
          })
          .catch(() => toast.hideLoading());
      })
      .catch(() => {});
  },

  /** 模拟配送进度（演示）：2→3→4→5 逐次推进 */
  onAdvance() {
    const id = this.opId();
    if (!id) return;
    toast.showLoading('推进中...');
    api.order
      .advance(id)
      .then((res) => {
        toast.hideLoading();
        const d = (res && res.data) || {};
        toast.showToast('已推进至「' + (d.statusText || '下一状态') + '」，演示环境不产生真实交易');
        this.reload();
      })
      .catch(() => toast.hideLoading());
  },

  /** 再来一单：商品重新加入购物车 */
  onRebuy() {
    const id = this.opId();
    if (!id) return;
    toast.showLoading('处理中...');
    api.order
      .rebuy(id)
      .then(() => {
        toast.hideLoading();
        toast.showSuccess('已加入购物车');
        app.refreshCartBadge();
      })
      .catch(() => toast.hideLoading());
  },

  /** 去评价 */
  onReview() {
    const id = this.opId();
    if (!id) return;
    wx.navigateTo({ url: '/pages/order/review?orderId=' + id });
  },

  /** 申请售后（V1.1 优化4）：跳申请售后页 */
  onAfterSale() {
    const id = this.opId();
    if (!id) return;
    wx.navigateTo({ url: '/pages/service/aftersale?orderId=' + id });
  },

  /** 售后处理中：跳售后工单详情 */
  onAfterSaleProgress() {
    const ticketId = this.data.afterSaleTicketId;
    if (!ticketId) {
      wx.navigateTo({ url: '/pages/service/tickets' });
      return;
    }
    wx.navigateTo({ url: '/pages/service/tickets?id=' + ticketId });
  },

  /** 订单操作统一用数字 id（详情可能以 orderNo 入参打开） */
  opId() {
    const order = this.data.order;
    if (!order) return '';
    return Number(order.id) || this.data.id;
  },

  /* ==================== 信息交互 ==================== */

  /** 复制订单号 */
  onCopyOrderNo() {
    const orderNo = this.data.order && this.data.order.orderNo;
    if (!orderNo) return;
    wx.setClipboardData({
      data: String(orderNo),
      success: () => toast.showSuccess('订单号已复制'),
      fail: () => toast.showError('复制失败')
    });
  },

  /** 拨打骑手电话（演示号码） */
  onCallRider() {
    const rider = this.data.order && this.data.order.rider;
    if (!rider || !rider.phone) return;
    wx.makePhoneCall({
      phoneNumber: String(rider.phone),
      fail: () => toast.showToast('演示环境，骑手号码为虚拟号码')
    });
  },

  /** 商品项跳商品详情 */
  onGoGoods(e) {
    const goodsId = e.currentTarget.dataset.goodsId;
    if (!goodsId) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + goodsId });
  },

  /** 配送规则说明 */
  onFreightTip() {
    toast.showToast('起步5元含3km，超出1元/km，满59免基础配送费');
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['order.items[' + index + '].pic']: DEFAULT_IMG });
  },

  onRiderImgError() {
    this.setData({ 'order.rider.avatar': DEFAULT_IMG });
  }
});
