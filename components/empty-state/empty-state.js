/**
 * 统一空态组件：居中插图 + 文案 + 可选操作按钮
 * 用法：<empty-state text="购物车还是空的" btn-text="去逛逛 →" bind:action="onGo" />
 */
Component({
  properties: {
    image: { type: String, value: '/image/cry.png' },
    text: { type: String, value: '暂无数据' },
    btnText: { type: String, value: '' }
  },
  methods: {
    onAction() {
      this.triggerEvent('action');
    },
    // 图片兜底：加载失败回退本地默认图
    onImgError() {
      this.setData({ image: '/static/images/default.png' });
    }
  }
});
