// pages/service/tickets.js
// 售后服务工单页：状态 Tab + 分页 + 骨架屏 + 空态；点击工单卡半屏弹层查看详情（含状态跟踪 timeline）
// 支持 ?id=xx 自动展开详情；操作：撤销申请 / 模拟商家处理（演示）/ 评价售后
// 数据层统一走 api/index.js（aftersale.page|detail|advance|cancel + service.rate）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';

// 状态 Tab：0全部/1待审核/2处理中/3已完成/5已撤销
const TABS = [
  { status: 0, name: '全部' },
  { status: 1, name: '待审核' },
  { status: 2, name: '处理中' },
  { status: 3, name: '已完成' },
  { status: 5, name: '已撤销' }
];
const PAGE_SIZE = 10;

/** 类型胶囊配色：仅退款红 / 退货退款橙 / 换货蓝 */
const TYPE_CLASS = { 1: 'tp-1', 2: 'tp-2', 3: 'tp-3' };
/** 状态徽章配色：待审核橙 / 处理中蓝 / 已完成绿 / 已拒绝灰 / 已撤销灰 */
const STATUS_CLASS = { 1: 'st-1', 2: 'st-2', 3: 'st-3', 4: 'st-4', 5: 'st-5' };
/** 工单状态文案兜底（接口正常下发 statusText，此处仅防 timeline 节点缺字段） */
const STATUS_TEXT_FALLBACK = { 1: '待审核', 2: '处理中', 3: '已完成', 4: '已拒绝', 5: '已撤销' };
const SCORE_TEXT = { 1: '很差', 2: '较差', 3: '一般', 4: '满意', 5: '超赞' };
const MAX_LEN = 100;

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
    noMore: false,

    // 工单详情弹层
    showDetail: false,
    detailLoading: false,
    detail: null,

    // 售后评价弹层
    showRate: false,
    rateSubmitting: false,
    rateSolve: 5,
    rateSolveText: SCORE_TEXT[5],
    rateContent: '',
    maxLen: MAX_LEN
  },

  onLoad(options) {
    // ?id=xx：列表加载完成后自动展开该工单详情
    this.autoId = Number((options && options.id) || 0);
    this.autoOpened = false;
    this.operating = false;
  },

  /** onShow 重查当前 Tab 第一页：申请售后 / 订单详情返回后状态同步 */
  onShow() {
    this.loadList(true);
    if (this.data.showDetail && this.data.detail) this.openDetail(this.data.detail.id);
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

  /* ==================== 列表加载 ==================== */

  /**
   * @param {boolean} reset true=重置到第一页（切 Tab / 下拉 / 操作后刷新）
   */
  loadList(reset) {
    const current = reset ? 1 : this.data.current + 1;
    if (reset) this.setData({ loading: this.data.records.length === 0, noMore: false });
    else this.setData({ loadingMore: true });

    return api.aftersale
      .page({ status: this.data.status, current: current, size: PAGE_SIZE })
      .then((res) => {
        const d = (res && res.data) || {};
        const rows = (d.records || []).map((t) => this.decorate(t));
        const list = reset ? rows : this.data.records.concat(rows);
        const total = Number(d.total) || 0;
        this.setData({
          records: list,
          current: Number(d.current) || current,
          total: total,
          loading: false,
          loadingMore: false,
          noMore: list.length >= total
        });
        this.checkAutoOpen();
      })
      .catch(() => {
        this.setData({ loading: false, loadingMore: false });
        this.checkAutoOpen();
      });
  },

  /** 工单卡展示字段预处理：类型胶囊 / 状态徽章样式类 */
  decorate(t) {
    return Object.assign({}, t, {
      typeClass: TYPE_CLASS[t.type] || 'tp-1',
      statusClass: STATUS_CLASS[t.status] || 'st-5'
    });
  },

  /** ?id=xx：首次列表加载完成后自动打开详情弹层（只触发一次） */
  checkAutoOpen() {
    if (!this.autoId || this.autoOpened) return;
    this.autoOpened = true;
    this.openDetail(this.autoId);
  },

  /* ==================== Tab 切换 ==================== */

  onTabTap(e) {
    const status = Number(e.currentTarget.dataset.status);
    if (status === this.data.status) return;
    this.setData({ status: status, records: [], current: 1, total: 0, noMore: false, loading: true });
    this.loadList(true);
  },

  /* ==================== 工单详情 ==================== */

  onCardTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!id) return;
    this.openDetail(id);
  },

  /** api.aftersale.detail(id) → 半屏弹层（订单号 / 原因 / 描述 / 凭证 / 状态跟踪 timeline） */
  openDetail(id) {
    if (!id) return Promise.resolve();
    this.setData({ showDetail: true, detailLoading: true });
    return api.aftersale
      .detail(id)
      .then((res) => {
        this.setData({ detail: this.decorateDetail((res && res.data) || null), detailLoading: false });
      })
      .catch(() => {
        this.setData({ detailLoading: false });
      });
  },

  /** 详情预处理：timeline 倒序（最新在前并高亮）+ 操作按钮可用态 */
  decorateDetail(t) {
    if (!t) return null;
    const status = Number(t.status);
    const timeline = (t.timeline || [])
      .slice()
      .reverse()
      .map((x, i) =>
        Object.assign({}, x, {
          latest: i === 0,
          statusText: x.statusText || STATUS_TEXT_FALLBACK[x.status] || ''
        })
      );
    const refundAmount = Number(t.refundAmount) || 0;
    return Object.assign({}, t, {
      typeClass: TYPE_CLASS[t.type] || 'tp-1',
      statusClass: STATUS_CLASS[t.status] || 'st-5',
      timeline: timeline,
      canCancel: status === 1 || status === 2,
      canAdvance: status === 1 || status === 2,
      isDone: status === 3,
      refundDone: status === 3 && refundAmount > 0 && (Number(t.type) === 1 || Number(t.type) === 2),
      refundAmount: refundAmount
    });
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  /** 详情内订单号 → 订单详情页 */
  onGoOrder() {
    const detail = this.data.detail;
    if (!detail || !detail.orderId) return;
    wx.navigateTo({ url: '/pages/order/detail?id=' + detail.orderId });
  },

  /** 凭证图预览 */
  onPreviewImage(e) {
    const ii = Number(e.currentTarget.dataset.ii);
    const detail = this.data.detail;
    const images = (detail && detail.images) || [];
    if (!images.length) return;
    wx.previewImage({ current: images[ii], urls: images });
  },

  /* ==================== 工单操作 ==================== */

  /** 撤销申请（仅待审核 / 处理中） */
  onCancelTicket() {
    const detail = this.data.detail;
    if (!detail || this.operating) return;
    toast
      .confirm('撤销后本次售后申请将关闭，如需售后请重新申请。确定撤销吗？', '撤销申请')
      .then((ok) => {
        if (!ok) return null;
        this.operating = true;
        toast.showLoading('处理中...');
        return api.aftersale
          .cancel(detail.id)
          .then(() => {
            toast.hideLoading();
            this.operating = false;
            toast.showSuccess('售后申请已撤销');
            this.refreshAll();
          })
          .catch(() => {
            toast.hideLoading();
            this.operating = false;
          });
      })
      .catch(() => {});
  },

  /** 模拟商家处理（演示按钮）：待审核→处理中→已完成，可连续点击 */
  onAdvanceTicket() {
    const detail = this.data.detail;
    if (!detail || this.operating) return;
    this.operating = true;
    toast.showLoading('推进中...');
    api.aftersale
      .advance(detail.id)
      .then((res) => {
        toast.hideLoading();
        this.operating = false;
        const d = (res && res.data) || {};
        toast.showToast('已推进至「' + (d.statusText || '下一状态') + '」，演示环境不产生真实交易');
        this.refreshAll();
      })
      .catch(() => {
        toast.hideLoading();
        this.operating = false;
      });
  },

  /** 操作成功后：刷新列表 + 当前详情 */
  refreshAll() {
    this.loadList(true);
    const detail = this.data.detail;
    if (this.data.showDetail && detail) this.openDetail(detail.id);
  },

  /* ==================== 评价售后 ==================== */

  openRate() {
    if (!this.data.detail) return;
    this.setData({ showRate: true, rateSolve: 5, rateSolveText: SCORE_TEXT[5], rateContent: '' });
  },

  closeRate() {
    this.setData({ showRate: false });
  },

  onSolveChange(e) {
    const value = Math.min(5, Math.max(1, Number(e.detail.value) || 5));
    this.setData({ rateSolve: value, rateSolveText: SCORE_TEXT[value] });
  },

  onRateInput(e) {
    this.setData({ rateContent: e.detail.value });
  },

  /** 售后评价复用客服评价接口：响应速度固定 5 星，解决满意度取用户打分 */
  submitRate() {
    if (this.data.rateSubmitting) return;
    this.setData({ rateSubmitting: true });
    toast.showLoading('提交中...');
    api.service
      .rate({ speed: 5, solve: this.data.rateSolve, content: this.data.rateContent })
      .then(() => {
        toast.hideLoading();
        this.setData({ showRate: false, rateSubmitting: false });
        toast.showSuccess('感谢您的评价');
      })
      .catch(() => {
        toast.hideLoading();
        this.setData({ rateSubmitting: false });
      });
  },

  /* ==================== 其他跳转 ==================== */

  /** 空态引导：联系客服 */
  onGoChat() {
    wx.navigateTo({ url: '/pages/service/chat' });
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['records[' + index + '].goodsPic']: DEFAULT_IMG });
  },

  onDetailImgError() {
    this.setData({ 'detail.goodsPic': DEFAULT_IMG });
  },

  onEvidenceImgError(e) {
    const ii = Number(e.currentTarget.dataset.ii);
    const detail = this.data.detail;
    if (!detail || !detail.images || !detail.images[ii]) return;
    this.setData({ ['detail.images[' + ii + ']']: DEFAULT_IMG });
  }
});
