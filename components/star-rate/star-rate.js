/**
 * 星级评分组件（纯 CSS/WXML 实现，评价页与评价展示共用）
 * 用法：
 *   展示：<star-rate value="{{review.score}}" readonly size="28" />
 *   打分：<star-rate value="{{score}}" bind:change="onScore" size="52" />
 */
Component({
  properties: {
    value: { type: Number, value: 5 },
    count: { type: Number, value: 5 },
    size: { type: Number, value: 32 }, // rpx
    readonly: { type: Boolean, value: true },
    activeColor: { type: String, value: '#ffb400' }
  },
  data: {
    stars: []
  },
  observers: {
    'value, count': function (value, count) {
      const stars = [];
      for (let i = 1; i <= count; i++) {
        stars.push(i <= Math.round(value));
      }
      this.setData({ stars });
    }
  },
  lifetimes: {
    attached() {
      const stars = [];
      for (let i = 1; i <= this.data.count; i++) stars.push(i <= Math.round(this.data.value));
      this.setData({ stars });
    }
  },
  methods: {
    onTap(e) {
      if (this.data.readonly) return;
      const v = Number(e.currentTarget.dataset.index) + 1;
      this.setData({ value: v });
      this.triggerEvent('change', { value: v });
    }
  }
});
