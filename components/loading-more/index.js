// components/loading-more —— 上拉加载状态：loading / nomore / hidden
Component({
  properties: {
    status: {
      type: String,
      value: 'hidden' // loading | nomore | hidden
    },
    text: {
      type: String,
      value: '加载中...'
    },
    endText: {
      type: String,
      value: '没有更多了'
    }
  }
});
