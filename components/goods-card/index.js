// components/goods-card —— 商品卡片（grid 双列 / list 横向 / recommend 推荐）
const fmt = require('../../utils/format.js');

Component({
  properties: {
    goods: { type: Object, value: {} },
    mode: { type: String, value: 'grid' }, // grid | list | mini
    showAdd: { type: Boolean, value: true },
    extraText: { type: String, value: '' }
  },
  data: {
    salesText: ''
  },
  observers: {
    'goods': function (g) {
      if (g) this.setData({ salesText: fmt.formatSales(g.numberSells || g.sales || 0) });
    }
  },
  methods: {
    onTap() {
      const id = this.data.goods.id;
      wx.navigateTo({ url: '/pages/detail/detail?product_id=' + id });
    },
    onAdd() {
      this.triggerEvent('add', { goods: this.data.goods });
    }
  }
});
