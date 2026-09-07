// components/safe-image —— 统一图片组件，加载失败自动回退本地默认图
const DEFAULT_IMG = '/static/images/default.png'

Component({
  options: {
    multipleSlots: false
  },
  externalClasses: ['custom-class'],
  properties: {
    src: {
      type: String,
      value: ''
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    lazy: {
      type: Boolean,
      value: false
    },
    customStyle: {
      type: String,
      value: ''
    },
    fallback: {
      type: String,
      value: DEFAULT_IMG
    }
  },
  data: {
    failed: false,
    DEFAULT_IMG: DEFAULT_IMG
  },
  observers: {
    src() {
      // 切换新图后重置失败态
      this.setData({ failed: false })
    }
  },
  methods: {
    onError() {
      this.setData({ failed: true })
    }
  }
})
