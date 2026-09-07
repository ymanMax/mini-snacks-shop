// components/skeleton —— 骨架屏（呼吸色块）
Component({
  properties: {
    // home | grid | list | detail | order | cart
    type: {
      type: String,
      value: 'list'
    },
    count: {
      type: Number,
      value: 4
    }
  },
  data: {
    list: [1, 2, 3, 4, 5, 6, 7, 8]
  }
})
