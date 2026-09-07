// pages/order/review.js
// 评价晒单页：逐商品评价（星级 + 快捷标签 + 内容 + 晒图）+ 店铺三维度评价
// 数据层统一走 api/index.js；晒图在 Mock 环境使用本地临时路径（联调时切 api.http.upload）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const DEFAULT_IMG = '/static/images/default.png';
const MAX_IMG = 6;
const MAX_LEN = 200;
/** 星下文案 */
const SCORE_TEXT = { 1: '很差', 2: '较差', 3: '一般', 4: '满意', 5: '超赞' };

Page({
  data: {
    loading: true,
    submitting: false,
    orderId: '',
    orderNo: '',
    goodsList: [], // [{goodsId,name,pic,specText,score,scoreText,tagPool:[{name,sel}],tags,content,images}]
    shop: { fresh: 5, speed: 5, package: 5, content: '' },
    shopText: { fresh: SCORE_TEXT[5], speed: SCORE_TEXT[5], package: SCORE_TEXT[5] },
    maxImg: MAX_IMG,
    maxLen: MAX_LEN
  },

  onLoad(options) {
    const orderId = Number((options && options.orderId) || 0);
    this.setData({ orderId: orderId ? String(orderId) : '' });
    this.loadOrder();
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /* ==================== 数据加载 ==================== */

  loadOrder() {
    if (!this.data.orderId) {
      this.setData({ loading: false });
      return Promise.resolve();
    }
    return api.order
      .detail(this.data.orderId)
      .then((res) => {
        const order = (res && res.data) || {};
        const seen = {};
        const goodsList = [];
        (order.items || []).forEach((it) => {
          const gid = Number(it.goodsId);
          if (!gid || seen[gid]) return; // 同商品多规格合并为一条评价
          seen[gid] = true;
          goodsList.push({
            goodsId: gid,
            name: it.name,
            pic: it.pic,
            specText: it.specText || '',
            score: 5, // 默认 5 星
            scoreText: SCORE_TEXT[5],
            tagPool: [],
            tags: [],
            content: '',
            images: []
          });
        });
        this.setData({ orderNo: order.orderNo || '', goodsList, loading: false });
        this.loadTagPools();
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  /** 逐商品拉取快捷标签池 */
  loadTagPools() {
    this.data.goodsList.forEach((g, i) => {
      api.review
        .goodsSummary(g.goodsId)
        .then((res) => {
          const d = (res && res.data) || {};
          const pool = (d.tagPool || []).map((t) => ({ name: t, sel: false }));
          this.setData({ ['goodsList[' + i + '].tagPool']: pool });
        })
        .catch(() => {});
    });
  },

  /* ==================== 商品评价 ==================== */

  /** 星级打分（star-rate bind:change） */
  onGoodsScore(e) {
    const index = Number(e.currentTarget.dataset.index);
    const value = Math.min(5, Math.max(1, Number(e.detail.value) || 5));
    this.setData({
      ['goodsList[' + index + '].score']: value,
      ['goodsList[' + index + '].scoreText']: SCORE_TEXT[value]
    });
  },

  /** 快捷标签多选 */
  onToggleTag(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ti = Number(e.currentTarget.dataset.ti);
    const g = this.data.goodsList[index];
    if (!g || !g.tagPool[ti]) return;
    const pool = g.tagPool.map((t, i) => (i === ti ? Object.assign({}, t, { sel: !t.sel }) : t));
    this.setData({
      ['goodsList[' + index + '].tagPool']: pool,
      ['goodsList[' + index + '].tags']: pool.filter((t) => t.sel).map((t) => t.name)
    });
  },

  onContentInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ ['goodsList[' + index + '].content']: e.detail.value });
  },

  /* ==================== 晒图上传 ==================== */

  onChooseImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const g = this.data.goodsList[index];
    if (!g) return;
    const remain = MAX_IMG - g.images.length;
    if (remain <= 0) {
      toast.showToast('最多上传 ' + MAX_IMG + ' 张图片');
      return;
    }
    const handle = (paths) => this.uploadImages(index, (paths || []).slice(0, remain));

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
   * 晒图：Mock 环境直接使用本地临时路径展示（契约允许）
   * 联调真实后端时把下面一行换成 api.http.upload('/upload', p, 'file') 并取 res.data.url 即可
   */
  uploadImages(index, paths) {
    if (!paths.length) return;
    const g = this.data.goodsList[index];
    if (!g) return;
    const images = g.images.concat(paths).slice(0, MAX_IMG);
    this.setData({ ['goodsList[' + index + '].images']: images });
    if (images.length >= MAX_IMG) toast.showToast('最多上传 ' + MAX_IMG + ' 张图片');
  },

  onPreviewImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ii = Number(e.currentTarget.dataset.ii);
    const g = this.data.goodsList[index];
    if (!g || !g.images.length) return;
    wx.previewImage({ current: g.images[ii], urls: g.images });
  },

  onDeleteImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ii = Number(e.currentTarget.dataset.ii);
    const g = this.data.goodsList[index];
    if (!g) return;
    const images = g.images.slice();
    images.splice(ii, 1);
    this.setData({ ['goodsList[' + index + '].images']: images });
  },

  /* ==================== 店铺评价 ==================== */

  onShopScore(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    const value = Math.min(5, Math.max(1, Number(e.detail.value) || 5));
    this.setData({
      ['shop.' + key]: value,
      ['shopText.' + key]: SCORE_TEXT[value]
    });
  },

  onShopInput(e) {
    this.setData({ 'shop.content': e.detail.value });
  },

  /* ==================== 提交 ==================== */

  onSubmit() {
    if (this.data.submitting) return;
    const list = this.data.goodsList;
    if (!list.length) {
      toast.showToast('没有可评价的商品');
      return;
    }
    // 校验：每个商品都必须已选星级
    const missing = list.filter((g) => !g.score || g.score < 1);
    if (missing.length) {
      toast.showToast('请为每个商品打分');
      return;
    }

    this.setData({ submitting: true });
    toast.showLoading('提交中...');

    const orderId = Number(this.data.orderId);
    // 串行提交，避免并发写入互相覆盖
    let chain = Promise.resolve();
    list.forEach((g) => {
      chain = chain.then(() =>
        api.review.submitGoods({
          orderId,
          goodsId: g.goodsId,
          score: g.score,
          tags: g.tags,
          content: g.content,
          images: g.images
        })
      );
    });
    chain
      .then(() =>
        api.review.submitShop({
          orderId,
          scores: {
            fresh: this.data.shop.fresh,
            speed: this.data.shop.speed,
            package: this.data.shop.package
          },
          content: this.data.shop.content
        })
      )
      .then(() => {
        toast.hideLoading();
        // 带图评价积分 +30，纯文字 +20
        const hasImage = list.some((g) => g.images.length > 0);
        toast.showSuccess(hasImage ? '评价成功，积分+30' : '评价成功，积分+20');
        setTimeout(() => {
          wx.navigateBack({
            fail: () => wx.switchTab({ url: '/pages/mine/mine' })
          });
        }, 1500);
      })
      .catch(() => {
        toast.hideLoading();
        this.setData({ submitting: false });
      });
  },

  /* ==================== 图片兜底 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['goodsList[' + index + '].pic']: DEFAULT_IMG });
  },

  /** 晒图（本地临时路径）加载失败时回退默认图 */
  onUploadImgError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ii = Number(e.currentTarget.dataset.ii);
    const g = this.data.goodsList[index];
    if (!g || !g.images[ii]) return;
    this.setData({ ['goodsList[' + index + '].images[' + ii + ']']: DEFAULT_IMG });
  }
});
