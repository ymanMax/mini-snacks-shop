// components/load-more —— 上拉加载状态
Component({
  properties: {
    // loading | nomore | error | hidden
    status: { type: String, value: 'hidden' },
    text: { type: String, value: '' }
  },
  methods: {
    retry() {
      this.triggerEvent('retry')
    }
  }
})
