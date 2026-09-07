// components/empty —— 统一空状态：居中插图 + 文案 + 可选操作按钮
Component({
  properties: {
    image: {
      type: String,
      value: '/image/cry.png'
    },
    text: {
      type: String,
      value: '暂时没有数据'
    },
    subText: {
      type: String,
      value: ''
    },
    btnText: {
      type: String,
      value: ''
    },
    top: {
      type: String,
      value: '120rpx'
    }
  },
  methods: {
    onButton() {
      this.triggerEvent('button');
    }
  }
});
