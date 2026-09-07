// components/safe-image —— 统一图片组件：加载失败自动回退本地默认图
Component({
  options: {
    multipleSlots: true
  },
  externalClasses: ['img-class', 'wrap-class'],
  properties: {
    src: {
      type: String,
      value: ''
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    defaultSrc: {
      type: String,
      value: '/static/images/default.png'
    },
    lazyLoad: {
      type: Boolean,
      value: false
    }
  },
  data: {
    failed: false,
    innerSrc: ''
  },
  observers: {
    src(v) {
      this.setData({ failed: false, innerSrc: v });
    }
  },
  lifetimes: {
    attached() {
      this.setData({ innerSrc: this.data.src });
    }
  },
  methods: {
    onError() {
      if (this.data.failed) return;
      this.setData({ failed: true, innerSrc: this.data.defaultSrc });
      this.triggerEvent('error');
    },
    onTap(e) {
      this.triggerEvent('tap', e.detail);
    }
  }
});
