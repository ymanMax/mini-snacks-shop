// pages/service/apply.js —— 申请售后页
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TYPES = [
  { value: 1, label: '仅退款', icon: '💸', desc: '未收到货/协商退款，无需退货' },
  { value: 2, label: '退货退款', icon: '📦', desc: '退回商品后退款' },
  { value: 3, label: '换货', icon: '🔄', desc: '免费更换同款商品' }
];

const REASONS = ['商品破损', '少发漏发', '质量问题', '不喜欢不想要', '其他'];

Page({
  data: {
    loading: true,
    orderId: 0,
    order: null,
    firstItem: null,
    types: TYPES,
    type: 1,
    reasons: REASONS,
    reason: REASONS[0],
    description: '',
    images: [],
    submitting: false
  },

  onLoad(options) {
    const orderId = Number((options || {}).orderId) || 0;
    if (!orderId) {
      toast.showToast('订单参数缺失');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      return;
    }
    this.setData({ orderId });
    api.getOrderDetail(orderId).then(o => {
      this.setData({
        order: o,
        firstItem: (o.items || [])[0] || null
      });
    }).catch(() => {
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  chooseType(e) {
    this.setData({ type: Number(e.currentTarget.dataset.v) });
  },

  chooseReason(e) {
    this.setData({ reason: e.currentTarget.dataset.r });
  },

  onDesc(e) {
    this.setData({ description: e.detail.value });
  },

  // ===== 凭证图片（最多 3 张） =====
  chooseImage() {
    const remain = 3 - this.data.images.length;
    if (remain <= 0) {
      toast.showToast('最多上传 3 张凭证');
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      success: res => {
        const paths = res.tempFilePaths || [];
        if (!paths.length) return;
        toast.showLoading('上传中...');
        Promise.all(paths.map(p => api.upload(p).catch(() => null)))
          .then(results => {
            const urls = results.filter(r => r && r.url).map(r => r.url);
            if (urls.length) {
              this.setData({ images: this.data.images.concat(urls).slice(0, 3) });
            }
          })
          .finally(() => toast.hideLoading());
      },
      fail: () => {}
    });
  },

  delImage(e) {
    const i = Number(e.currentTarget.dataset.index);
    const images = this.data.images.slice();
    images.splice(i, 1);
    this.setData({ images });
  },

  previewImage(e) {
    const i = Number(e.currentTarget.dataset.index);
    wx.previewImage({ urls: this.data.images, current: this.data.images[i] });
  },

  // ===== 提交 =====
  submit() {
    if (this.data.submitting) return;
    if (!this.data.order) return;
    this.setData({ submitting: true });
    api.applyAftersale({
      orderId: this.data.orderId,
      type: this.data.type,
      reason: this.data.reason,
      description: this.data.description.trim(),
      images: this.data.images
    }).then(() => {
      toast.success('售后申请已提交');
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/service/aftersale' });
      }, 1200);
    }).catch(() => {
      // 失败原因（重复申请/状态不符）api 层已自动 toast
      this.setData({ submitting: false });
    });
  },

  noop() {},

  onImgError() {
    this.setData({ imgErr: true });
  }
});
