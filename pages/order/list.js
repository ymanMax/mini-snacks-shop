// pages/order/list.js
// 我的订单列表：状态 Tab + 分页 + 下拉刷新 + 各状态操作（支付/取消/确认收货/再来一单/去评价）
// 数据层统一走 api/index.js；金额直接展示接口返回的数字（wxml 用 fmt 格式化）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const app = getApp();
const DEFAULT_IMG = '/static/images/default.png';

// 状态 Tab：0全部/1待付款/2待发货/3配送中/4待收货/5已完成/7待评价
const TABS = [
  { status: 0, name: '全部' },
  { status: 1, name: '待付款' },
  { status: 2, name: '待发货' },
  { status: 3, name: '配送中' },
  { status: 4, name: '待收货' },
  { status: 5, name: '已完成' },
  { status: 7, name: '待评价' }
];
const PAGE_SIZE = 10;

Page({
  data: {
    tabs: TABS,
    status: 0,
    records: [],
    current: 1,
    total: 0,
    size: PAGE_SIZE,
    loading: true, // 首屏骨架屏
    loadingMore: false,
    noMore: false
  },

  onLoad(options) {
    // 接收 options.status 定位初始 Tab（默认 0 全部）
    const status = Number(options && options.status) || 0;
    const exist = TABS.some((t) => t.status === status);
    this.setData({ status: exist ? status : 0 });
    this.paying = false;
  },

  /** onShow 重查当前 Tab 第一页：支付 / 评价 / 详情返回后状态同步 */
  onShow() {
    this.loadList(true);
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  onPullDownRefresh() {
    this.loadList(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loadingMore || this.data.loading) return;
    this.loadList(false);
  },

  /* ==================== 数据加载 ==================== */

  /**
   * @param {boolean} reset true=重置到第一页（切 Tab / 下拉 / 操作后刷新）
   */
  loadList(reset) {
    const current = reset ? 1 : this.data.current + 1;
    if (reset) this.setData({ loading: this.data.records.length === 0, noMore: false });
    else this.setData({ loadingMore: true });

    return api.order
      .page({ status: this.data.status, current, size: PAGE_SIZE })
      .then((res) => {
        const d = (res && res.data) || {};
        const rows = (d.records || []).map((o) => this.decorate(o));
        const list = reset ? rows : this.data.records.concat(rows);
        const total = Number(d.total) || 0;
        this.setData({
          records: list,
          current: Number(d.current) || current,
          total,
          loading: false,
          loadingMore: false,
          noMore: list.length >= total
        });
      })
      .catch(() => {
        this.setData({ loading: false, loadingMore: false });
      });
  },

  /** 订单卡展示字段预处理：缩略图（最多 4 张）/ 件数 / 状态样式类 / 售后入口 */
  decorate(o) {
    const items = o.items || [];
    let pieces = 0;
    items.forEach((it) => {
      pieces += Number(it.count) || 0;
    });
    const as = o.afterSale || null;
    const asStatus = as ? Number(as.status) || 0 : 0;
    const status = Number(o.status) || 0;
    const paid = status >= 2 && status <= 5;
    // 售后进行中：待审核(1)/处理中(2)/已完成(3) → 卡片显示「售后中」
    const ongoing = !!as && (asStatus === 1 || asStatus === 2 || asStatus === 3);
    return Object.assign({}, o, {
      thumbs: items.slice(0, 4),
      moreThan4: items.length > 4,
      goodsKinds: items.length,
      pieces,
      firstGoods: items.length ? items[0].name : '',
      stClass: 'st-' + o.status,
      // 可申请售后：已支付~已完成，且无售后记录或售后被拒(4)/已撤销(5)
      canAfterSale: paid && !ongoing && (!as || asStatus === 4 || asStatus === 5),
      afterSaleOngoing: paid && ongoing,
      afterSaleTicketId: as && as.ticketId ? String(as.ticketId) : ''
    });
  },

  /* ==================== Tab 切换 ==================== */

  onTabTap(e) {
    const status = Number(e.currentTarget.dataset.status);
    if (status === this.data.status) return;
    this.setData({ status, records: [], current: 1, total: 0, noMore: false, loading: true });
    this.loadList(true);
  },

  /* ==================== 订单操作 ==================== */

  onGoDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order/detail?id=' + id });
  },

  /** 取消订单（待付款） */
  onCancel(e) {
    const id = Number(e.currentTarget.dataset.id);
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
            this.loadList(true);
          })
          .catch(() => toast.hideLoading());
      })
      .catch(() => {});
  },

  /** 去支付：Mock 支付（showLoading 2 秒 → api.order.pay → 刷新列表） */
  onPay(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (this.paying) return;
    this.paying = true;
    toast.showLoading('支付中...');
    // 演示环境，不产生真实交易：仅本地 mock 支付流程
    setTimeout(() => {
      api.order
        .pay(id)
        .then(() => {
          toast.hideLoading();
          this.paying = false;
          toast.showSuccess('支付成功，演示环境不产生真实交易');
          this.loadList(true);
        })
        .catch(() => {
          toast.hideLoading();
          this.paying = false;
        });
    }, 2000);
  },

  /** 提醒发货（待发货） */
  onRemind() {
    toast.showToast('已提醒商家尽快发货');
  },

  /** 确认收货（配送中 / 待收货） */
  onConfirmReceive(e) {
    const id = Number(e.currentTarget.dataset.id);
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
            this.loadList(true);
          })
          .catch(() => toast.hideLoading());
      })
      .catch(() => {});
  },

  /** 再来一单（已完成）：商品重新加入购物车 */
  onRebuy(e) {
    const id = Number(e.currentTarget.dataset.id);
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

  /** 去评价（已完成且未评价） */
  onReview(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order/review?orderId=' + id });
  },

  /** 申请售后（V1.1 优化4，状态 2~5）：跳申请售后页 */
  onAfterSale(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!id) return;
    wx.navigateTo({ url: '/pages/service/aftersale?orderId=' + id });
  },

  /** 售后中：跳售后工单详情 */
  onAfterSaleProgress(e) {
    const ticketId = e.currentTarget.dataset.ticket;
    if (!ticketId) {
      wx.navigateTo({ url: '/pages/service/tickets' });
      return;
    }
    wx.navigateTo({ url: '/pages/service/tickets?id=' + ticketId });
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    const ti = e.currentTarget.dataset.ti;
    this.setData({ ['records[' + index + '].thumbs[' + ti + '].pic']: DEFAULT_IMG });
  }
});
