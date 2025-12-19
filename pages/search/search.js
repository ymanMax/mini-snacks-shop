const api = require('../../api/api.js');

Page({
  data: {
    keyword: '',
    products: [],
    categories: [],
    selectedCategory: null,
    selectedPrice: null,
    selectedSort: 'default',
    activeFilter: null,
    hasSearched: false
  },

  onLoad: function (options) {
    // 如果从其他页面传入关键词
    if (options.keyword) {
      this.setData({
        keyword: options.keyword
      });
      // 自动搜索
      this.onSearch();
    }

    // 获取分类数据
    this.getCategories();
  },

  // 获取分类数据
  getCategories: function () {
    api.getClass().then(res => {
      this.setData({
        categories: res
      });
    }).catch(err => {
      console.error('获取分类数据失败:', err);
    });
  },

  // 输入框变化
  onInputChange: function (e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索
  onSearch: function () {
    const { keyword, selectedCategory, selectedPrice, selectedSort } = this.data;

    // 构建搜索参数
    let params = {
      keyword: keyword,
      sort_by: selectedSort
    };

    if (selectedCategory) {
      params.category_id = selectedCategory;
    }

    if (selectedPrice) {
      const [min, max] = selectedPrice.split('-');
      params.min_price = min;
      params.max_price = max === '+' ? null : max;
    }

    // 调用搜索API
    api.searchProducts(params).then(res => {
      this.setData({
        products: res,
        hasSearched: true
      });
    }).catch(err => {
      console.error('搜索商品失败:', err);
      this.setData({
        products: [],
        hasSearched: true
      });
    });
  },

  // 清空关键词
  onClear: function () {
    this.setData({
      keyword: ''
    });
  },

  // 取消
  onCancel: function () {
    wx.navigateBack();
  },

  // 显示分类筛选
  showCategoryFilter: function () {
    this.setData({
      activeFilter: 'category'
    });
  },

  // 显示价格筛选
  showPriceFilter: function () {
    this.setData({
      activeFilter: 'price'
    });
  },

  // 显示排序筛选
  showSortFilter: function () {
    this.setData({
      activeFilter: 'sort'
    });
  },

  // 隐藏筛选
  hideFilter: function () {
    this.setData({
      activeFilter: null
    });
  },

  // 选择分类
  onCategorySelect: function (e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedCategory: categoryId
    });
  },

  // 选择价格区间
  onPriceSelect: function (e) {
    const priceRange = e.currentTarget.dataset.range;
    this.setData({
      selectedPrice: priceRange
    });
  },

  // 选择排序方式
  onSortSelect: function (e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({
      selectedSort: sortBy
    });
  },

  // 重置筛选条件
  onResetFilter: function () {
    this.setData({
      selectedCategory: null,
      selectedPrice: null,
      selectedSort: 'default'
    });
  },

  // 确认筛选条件
  onConfirmFilter: function () {
    this.hideFilter();
    this.onSearch();
  },

  // 页面分享
  onShareAppMessage: function () {
    return {
      title: '商品搜索',
      path: '/pages/search/search'
    };
  }
});
