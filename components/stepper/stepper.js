// components/stepper —— 数量步进器（受库存约束）
Component({
  properties: {
    value: { type: Number, value: 1 },
    min: { type: Number, value: 1 },
    max: { type: Number, value: 999 },
    disabled: { type: Boolean, value: false },
    small: { type: Boolean, value: false }
  },
  methods: {
    minus() {
      if (this.data.disabled) return
      const v = Math.max(this.data.min, this.data.value - 1)
      if (v !== this.data.value) this.triggerEvent('change', { value: v })
    },
    plus() {
      if (this.data.disabled) return
      if (this.data.value >= this.data.max) {
        wx.showToast({ title: '库存不足啦', icon: 'none' })
        return
      }
      this.triggerEvent('change', { value: this.data.value + 1 })
    },
    onInput(e) {
      let v = parseInt(e.detail.value) || this.data.min
      v = Math.min(this.data.max, Math.max(this.data.min, v))
      this.triggerEvent('change', { value: v })
    }
  }
})
