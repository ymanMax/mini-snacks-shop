// 模拟网络延迟
const mockDelay = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// 轮播图数据
const bannerData = {
  code: "success",
  data: [
    {
      id: 1,
      name: "零食大促销",
      img: {
        url: "/banner1.jpg"
      },
      description: "全场零食8折起"
    },
    {
      id: 2,
      name: "新品上市",
      img: {
        url: "/banner2.jpg"
      },
      description: "最新口味零食"
    },
    {
      id: 3,
      name: "会员专享",
      img: {
        url: "/banner3.jpg"
      },
      description: "会员享受额外优惠"
    }
  ]
};

// 主题信息数据
const themeData = {
  code: "success",
  data: {
    id: 1,
    name: "热门零食",
    description: "最受欢迎的零食推荐",
    products: [1, 2, 3],
    topic_img: {
      url: "/theme1.jpg"
    }
  }
};

// 商品数据
const productsData = {
  code: "success",
  data: [
    {
      id: 1,
      name: "薯片",
      price: 5.99,
      original_price: 7.99,
      main_img_url: "/product1.jpg",
      description: "香脆可口的薯片",
      category_id: 1,
      stock: 100,
      sales: 50
    },
    {
      id: 2,
      name: "巧克力",
      price: 12.99,
      original_price: 15.99,
      main_img_url: "/product2.jpg",
      description: "丝滑浓郁的巧克力",
      category_id: 2,
      stock: 80,
      sales: 30
    },
    {
      id: 3,
      name: "坚果",
      price: 8.99,
      original_price: 10.99,
      main_img_url: "/product3.jpg",
      description: "营养丰富的坚果",
      category_id: 1,
      stock: 60,
      sales: 20
    },
    {
      id: 4,
      name: "饼干",
      price: 6.99,
      original_price: 8.99,
      main_img_url: "/product4.jpg",
      description: "酥脆可口的饼干",
      category_id: 1,
      stock: 90,
      sales: 40
    },
    {
      id: 5,
      name: "糖果",
      price: 3.99,
      original_price: 4.99,
      main_img_url: "/product5.jpg",
      description: "甜蜜可口的糖果",
      category_id: 2,
      stock: 120,
      sales: 60
    }
  ]
};

// 商品详情数据
const productDetailData = {
  code: "success",
  data: {
    id: 1,
    name: "薯片",
    price: 5.99,
    original_price: 7.99,
    images: [
      "https://example.com/product1_1.jpg",
      "https://example.com/product1_2.jpg"
    ],
    description: "香脆可口的薯片，采用优质土豆制作，口感酥脆，味道鲜美。",
    category_id: 1,
    stock: 100,
    sales: 50,
    specifications: [
      {
        name: "口味",
        values: ["原味", "烧烤味", "番茄味"]
      },
      {
        name: "规格",
        values: ["100g", "200g", "500g"]
      }
    ],
    reviews: [
      {
        user_name: "用户A",
        rating: 5,
        comment: "很好吃，下次还会购买",
        date: "2023-10-01"
      },
      {
        user_name: "用户B",
        rating: 4,
        comment: "味道不错，价格实惠",
        date: "2023-10-02"
      }
    ]
  }
};

// 分类数据
const categoryData = {
  code: "success",
  data: [
    {
      id: 1,
      name: "膨化食品",
      image: "https://example.com/category1.jpg",
      description: "各种膨化零食"
    },
    {
      id: 2,
      name: "糖果巧克力",
      image: "https://example.com/category2.jpg",
      description: "甜蜜的糖果和巧克力"
    },
    {
      id: 3,
      name: "坚果炒货",
      image: "https://example.com/category3.jpg",
      description: "营养丰富的坚果"
    },
    {
      id: 4,
      name: "饼干糕点",
      image: "https://example.com/category4.jpg",
      description: "各种饼干和糕点"
    }
  ]
};

// 分类商品数据
const categoryProductsData = {
  code: "success",
  data: [
    {
      id: 1,
      name: "薯片",
      price: 5.99,
      image: "https://example.com/product1.jpg",
      category_id: 1
    },
    {
      id: 3,
      name: "坚果",
      price: 8.99,
      image: "https://example.com/product3.jpg",
      category_id: 1
    },
    {
      id: 4,
      name: "饼干",
      price: 6.99,
      image: "https://example.com/product4.jpg",
      category_id: 1
    }
  ]
};

// 订单数据
const orderData = {
  code: "success",
  data: {
    order_id: "ORDER202310010001",
    total_amount: 25.97,
    status: "pending",
    products: [
      {
        id: 1,
        name: "薯片",
        price: 5.99,
        quantity: 2,
        image: "https://example.com/product1.jpg"
      },
      {
        id: 2,
        name: "巧克力",
        price: 12.99,
        quantity: 1,
        image: "https://example.com/product2.jpg"
      }
    ]
  }
};

// 用户订单数据
const userOrdersData = {
  code: "success",
  data: [
    {
      order_id: "ORDER202310010001",
      total_amount: 25.97,
      status: "completed",
      create_time: "2023-10-01 10:30:00",
      products: [
        {
          id: 1,
          name: "薯片",
          price: 5.99,
          quantity: 2,
          image: "https://example.com/product1.jpg"
        }
      ]
    },
    {
      order_id: "ORDER202309280001",
      total_amount: 12.99,
      status: "pending",
      create_time: "2023-09-28 15:20:00",
      products: [
        {
          id: 2,
          name: "巧克力",
          price: 12.99,
          quantity: 1,
          image: "https://example.com/product2.jpg"
        }
      ]
    }
  ]
};

// 支付数据
const paymentData = {
  code: "success",
  data: {
    payment_id: "PAY202310010001",
    amount: 25.97,
    status: "success"
  }
};

// 用户验证数据
const userVerifyData = {
  code: "success",
  data: {
    user_id: 1,
    username: "testuser",
    token: "mock_token_123456"
  }
};

module.exports = {
  mockDelay,
  bannerData,
  themeData,
  productsData,
  productDetailData,
  categoryData,
  categoryProductsData,
  orderData,
  userOrdersData,
  paymentData,
  userVerifyData
};