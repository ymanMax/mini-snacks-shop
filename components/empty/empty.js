// components/empty —— 统一空状态：插图 + 文案 + 操作按钮
Component({
  externalClasses: ['custom-class'],
  properties: {
    img: {
      type: String,
      value: '/static/images/empty_search.png'
    },
    text: {
      type: String,
      value: '暂无数据'
    },
    sub: {
      type: String,
      value: ''
    },
    btnText: {
      type: String,
      value: ''
    },
    top: {
      type: String,
      value: '160rpx'
    }
  },
  methods: {
    onBtn() {
      this.triggerEvent('btn')
    }
  }
})
