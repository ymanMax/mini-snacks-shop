// pages/list/list.js —— 主题商品 / 分类商品（分页）
const app = getApp();
const { homeApi, goodsApi, categoryApi, cartApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    themeId: null,
    categoryId: null,
    header: null,
    products: [],
    loading: true,
    page: 1,
    size: 10,
    total: 0,
    loadStatus: 'hidden'
  },

  onLoad(options) {
    const params = {};
    if (options.item) {
      this.setData({ themeId: Number(options.item) });
      params.themeId = Number(options.item);
      homeApi.getTheme(options.item).then((t) => {
        this.setData({ header: t });
        wx.setNavigationBarTitle({ title: t.name });
      }).catch(() => {});
    }
    if (options.category) {
      this.setData({ categoryId: Number(options.category) });
      params.categoryId = Number(options.category);
      categoryApi.getCategories().then((list) => {
        const c = list.find((x) => x.id === Number(options.category));
        if (c) {
          this.setData({ header: { topicImg: c.icon, name: c.name, description: c.description } });
          wx.setNavigationBarTitle({ title: c.name });
        }
      });
    }
    this._params = params;
    this.load(true);
  },

  onShow() {
    app.updateCartBadge();
  },

  load(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loadStatus: 'loading', loading: reset });
    const params = Object.assign({ current: page, size: this.data.size }, this._params);
    goodsApi.getPage(params).then((res) => {
      const list = reset ? res.records : this.data.products.concat(res.records);
      this.setData({
        products: list,
        total: res.total,
        page: page + 1,
        loading: false,
        loadStatus: list.length >= res.total ? 'nomore' : 'hidden'
      });
    }).catch(() => this.setData({ loading: false, loadStatus: 'hidden' }));
  },

  onReachBottom() {
    if (this.data.products.length < this.data.total) this.load(false);
  },

  onPullDownRefresh() {
    this.load(true);
    setTimeout(() => wx.stopPullDownRefresh(), 700);
  },

  onAddCart(e) {
    const g = e.detail.goods;
    const taste = g.specs[1] && g.specs[1].values[0] ? g.specs[1].values[0].label : '原味';
    cartApi.add({ goodsId: g.id, count: 1, specText: '标准装 · ' + taste, price: g.price })
      .then(() => {
        toast.showSuccess('已加入购物车');
        app.updateCartBadge();
      });
  }
});
