// pages/service/aftersale.js
// 申请售后页：?orderId=订单id（必传）&type=1|2|3（可选预选）
// 售后类型三选一（仅退款/退货退款/换货）→ 原因 picker（随类型联动）→ 问题描述 → 凭证图片（≤6 张）
// 提交 api.aftersale.apply → toast「售后申请已提交」→ redirectTo 售后工单详情
// 数据层统一走 api/index.js；凭证图 Mock 环境直接使用本地临时路径
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';
const MAX_IMG = 6;
const MAX_LEN = 200;

/** 售后类型三选一卡片配置 */
const TYPES = [
  { value: 1, icon: '💰', name: '仅退款', desc: '未收到货 / 与商家协商一致，退款原路退回' },
  { value: 2, icon: '📦', name: '退货退款', desc: '商品有问题（破损、口感不佳等），寄回后退款' },
  { value: 3, icon: '🔄', name: '换货', desc: '拍错规格 / 商品瑕疵，换货不涉及退款' }
];

Page({
  data: {
    loading: true,
    submitting: false,
    orderId: '',
    order: null,
    goodsCount: 0,

    // 售后类型
    types: TYPES,
    type: 0, // 0=未选择
    typeText: '',

    // 原因（随类型联动）
    reasonsMap: {},
    reasonOptions: [],
    reasonIndex: -1,
    reason: '',
    reasonPlaceholder: '请先选择售后类型',

    // 描述 / 凭证
    desc: '',
    maxLen: MAX_LEN,
    images: [],
    maxImg: MAX_IMG,

    // 退款金额展示
    showRefund: false, // type 1/2 显示退款金额，type 3 显示"换货不涉及退款"
    refundAmount: 0,
    refundTip: '',

    // 状态限制：待付款订单不可申请售后
    pendingOrder: false,
    valid: false
  },

  onLoad(options) {
    const o = options || {};
    const orderId = o.orderId ? String(o.orderId) : '';
    const pre = Number(o.type) || 0;
    this.preType = [1, 2, 3].indexOf(pre) > -1 ? pre : 0;
    this.setData({ orderId });
    if (!orderId) {
      this.setData({ loading: false });
      toast.showError('缺少订单参数，请从订单详情进入');
      return;
    }
    this.loadAll();
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /* ==================== 数据加载（订单 + 售后字典并行） ==================== */

  loadAll() {
    this.setData({ loading: true });
    return Promise.all([api.order.detail(this.data.orderId), api.aftersale.reasons()])
      .then((results) => {
        const order = (results[0] && results[0].data) || null;
        const dict = (results[1] && results[1].data) || {};
        if (!order) {
          this.setData({ loading: false });
          return;
        }
        let goodsCount = 0;
        (order.items || []).forEach((it) => {
          goodsCount += Number(it.count) || 0;
        });
        const pendingOrder = Number(order.status) === 1;
        this.setData({
          order,
          goodsCount,
          reasonsMap: dict.reasons || {},
          pendingOrder,
          loading: false
        });
        // 待付款订单：提示直接取消订单并禁用提交；否则按入参预选类型
        if (pendingOrder) {
          this.setData({ refundTip: '待付款订单请直接取消订单，无需申请售后' });
          return;
        }
        if (this.preType) this.selectType(this.preType);
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  /* ==================== 售后类型 / 原因 ==================== */

  onTypeTap(e) {
    if (this.data.pendingOrder) {
      toast.showToast('待付款订单请直接取消订单');
      return;
    }
    const value = Number(e.currentTarget.dataset.type);
    if (!value || value === this.data.type) return;
    this.selectType(value);
  },

  /** 选择类型：联动原因 picker 选项 + 退款金额展示行 */
  selectType(value) {
    const conf = TYPES.filter((t) => t.value === value)[0] || null;
    const options = (this.data.reasonsMap[value] || []).slice();
    const payAmount = (this.data.order && this.data.order.payAmount) || 0;
    const isRefund = value === 1 || value === 2;
    this.setData({
      type: value,
      typeText: conf ? conf.name : '',
      reasonOptions: options,
      reasonIndex: -1,
      reason: '',
      reasonPlaceholder: options.length ? '请选择售后原因' : '该类型暂无可选原因',
      showRefund: isRefund,
      refundAmount: payAmount,
      refundTip: isRefund
        ? '退款将原路退回，预计 1-3 个工作日到账'
        : '换货不涉及退款，商家审核通过后为您安排寄出'
    });
    this.refreshValid();
  },

  onReasonChange(e) {
    const index = Number(e.detail.value);
    const reason = this.data.reasonOptions[index];
    if (!reason) return;
    this.setData({ reasonIndex: index, reason: reason });
    this.refreshValid();
  },

  /** 类型 + 原因必选，且非待付款订单 */
  refreshValid() {
    this.setData({
      valid: !this.data.pendingOrder && this.data.type > 0 && !!this.data.reason
    });
  },

  /* ==================== 问题描述 ==================== */

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  /* ==================== 凭证图片（≤6 张，Mock 环境用本地临时路径） ==================== */

  onChooseImage() {
    const remain = MAX_IMG - this.data.images.length;
    if (remain <= 0) {
      toast.showToast('最多上传 ' + MAX_IMG + ' 张凭证');
      return;
    }
    const handle = (paths) => this.appendImages((paths || []).slice(0, remain));

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: remain,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => handle((res.tempFiles || []).map((f) => f.tempFilePath)),
        fail: () => {}
      });
    } else {
      wx.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => handle(res.tempFilePaths || []),
        fail: () => {}
      });
    }
  },

  /**
   * 凭证图：Mock 环境直接保存本地临时路径（提交时原样传数组）
   * 联调真实后端时改为 api.http.upload('/upload', path, 'file') 取 res.data.url
   */
  appendImages(paths) {
    if (!paths.length) return;
    const images = this.data.images.concat(paths).slice(0, MAX_IMG);
    this.setData({ images });
    if (images.length >= MAX_IMG) toast.showToast('最多上传 ' + MAX_IMG + ' 张凭证');
  },

  onPreviewImage(e) {
    const ii = Number(e.currentTarget.dataset.ii);
    const images = this.data.images;
    if (!images.length) return;
    wx.previewImage({ current: images[ii], urls: images });
  },

  onDeleteImage(e) {
    const ii = Number(e.currentTarget.dataset.ii);
    const images = this.data.images.slice();
    images.splice(ii, 1);
    this.setData({ images });
  },

  /* ==================== 提交 ==================== */

  onSubmit() {
    if (this.data.submitting) return;
    if (this.data.pendingOrder) {
      toast.showToast('待付款订单请直接取消订单');
      return;
    }
    if (!this.data.order) {
      toast.showError('订单不存在或已被删除');
      return;
    }
    if (!this.data.type) {
      toast.showToast('请选择售后类型');
      return;
    }
    if (!this.data.reason) {
      toast.showToast('请选择售后原因');
      return;
    }

    this.setData({ submitting: true });
    toast.showLoading('提交中...');
    api.aftersale
      .apply({
        orderId: Number(this.data.orderId),
        type: this.data.type,
        reason: this.data.reason,
        desc: this.data.desc,
        images: this.data.images
      })
      .then((res) => {
        toast.hideLoading();
        const ticket = (res && res.data) || {};
        toast.showSuccess('售后申请已提交');
        const url = ticket.id
          ? '/pages/service/tickets?id=' + ticket.id
          : '/pages/service/tickets';
        setTimeout(() => {
          wx.redirectTo({ url: url, fail: () => wx.navigateBack() });
        }, 1200);
      })
      .catch(() => {
        toast.hideLoading();
        this.setData({ submitting: false });
      });
  },

  /* ==================== 跳转 ==================== */

  /** 待付款订单：回订单详情直接取消 */
  onGoOrder() {
    if (!this.data.orderId) return;
    wx.navigateTo({ url: '/pages/order/detail?id=' + this.data.orderId });
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['order.items[' + index + '].pic']: DEFAULT_IMG });
  },

  onUploadImgError(e) {
    const ii = Number(e.currentTarget.dataset.ii);
    if (!this.data.images[ii]) return;
    this.setData({ ['images[' + ii + ']']: DEFAULT_IMG });
  }
});
