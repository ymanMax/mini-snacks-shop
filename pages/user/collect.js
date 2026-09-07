// pages/user/collect.js —— 收藏记录（优化 10）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    list: [],
    editMode: false,   // 长按进入批量管理
    selected: {}       // goodsId -> bool
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  loadList() {
    return api.getCollectList().then(list => {
      this.setData({ list, loading: false, editMode: false, selected: {} });
    }).catch(() => this.setData({ loading: false }));
  },

  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  },

  onTapItem(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.editMode) {
      this.toggleSelect(id);
    } else {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }
  },

  // 单个取消收藏
  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    toast.confirm('取消收藏该商品？', '提示').then(ok => {
      if (!ok) return;
      api.removeCollects([id]).then(() => {
        toast.success('已取消收藏');
        this.setData({ list: this.data.list.filter(g => g.id !== id) });
      }).catch(() => {});
    });
  },

  // 长按进入批量删除模式
  onLongPress(e) {
    if (this.data.editMode) return;
    const id = e.currentTarget.dataset.id;
    this.setData({ editMode: true, selected: { [id]: true } });
  },

  toggleSelect(id) {
    const selected = Object.assign({}, this.data.selected);
    if (selected[id]) delete selected[id];
    else selected[id] = true;
    this.setData({ selected });
  },

  onCancelEdit() {
    this.setData({ editMode: false, selected: {} });
  },

  onBatchRemove() {
    const ids = Object.keys(this.data.selected).map(Number);
    if (!ids.length) {
      toast.showToast('请先选择要删除的商品');
      return;
    }
    toast.confirm('删除选中的 ' + ids.length + ' 件收藏？', '批量删除').then(ok => {
      if (!ok) return;
      api.removeCollects(ids).then(() => {
        toast.success('已删除');
        this.setData({
          list: this.data.list.filter(g => ids.indexOf(g.id) === -1),
          editMode: false,
          selected: {}
        });
      }).catch(() => {});
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
