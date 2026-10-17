// 河南大学校园二手交易平台第一版演示数据。
// 演示图片已本地化到 src/assets（离线也能显示）；后续接入 FastAPI + MongoDB 后会被远端数据替换。
import henuBook1 from "../assets/products/henu-book-1.webp";
import henuBook2 from "../assets/products/henu-book-2.webp";
import henuBook3 from "../assets/products/henu-book-3.webp";
import henuItem1 from "../assets/products/henu-item-1.webp";
import henuItem2 from "../assets/products/henu-item-2.webp";
import henuItem3 from "../assets/products/henu-item-3.webp";
import henuItem4 from "../assets/products/henu-item-4.webp";
import henuCampus from "../assets/course/henu-campus.webp";

export const CAMPUS_DATA = {
  products: [
    {
      id: "henu-book-1",
      title: "高等数学（同济第七版）",
      category: "书籍",
      stream: "book",
      price: 18,
      originalPrice: 58,
      mode: "BUY",
      condition: "九成新，少量笔记",
      stock: 1,
      campus: "金明校区",
      image: henuBook1,
      description: "适合大一高数课程使用，重点章节有少量荧光笔标注，书页完整。",
      pickupLocation: "金明校区图书馆门口",
      seller: { name: "李同学", email: "li@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=12", trustScore: 98, verified: true, department: "数学与统计学院 · 2024级", reviews: 16, rating: 4.9 }
    },
    {
      id: "henu-book-2",
      title: "教育学考研核心笔记",
      category: "书籍",
      stream: "book",
      price: 12,
      originalPrice: 45,
      mode: "BUY",
      condition: "八成新，含学长整理资料",
      stock: 1,
      campus: "明伦校区",
      image: henuBook2,
      description: "教育学专业学长整理的章节笔记和真题索引，适合备考或课程复习。",
      pickupLocation: "明伦校区大礼堂东门",
      seller: { name: "王同学", email: "wang@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=32", trustScore: 97, verified: true, department: "教育学部 · 2023级", reviews: 23, rating: 4.8 }
    },
    {
      id: "henu-book-3",
      title: "大学英语四级真题资料包",
      category: "书籍",
      stream: "book",
      price: 6,
      originalPrice: 29,
      mode: "BUY",
      condition: "全新未拆",
      stock: 3,
      campus: "金明校区",
      image: henuBook3,
      description: "历年真题、听力音频和作文模板，适合近期准备四级考试的同学。",
      pickupLocation: "金明校区生活服务中心",
      seller: { name: "赵同学", email: "zhao@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=47", trustScore: 99, verified: true, department: "外语学院 · 2024级", reviews: 8, rating: 5 }
    },
    {
      id: "henu-item-1",
      title: "小米蓝牙耳机",
      category: "数码产品",
      stream: "digital",
      price: 35,
      originalPrice: 99,
      mode: "BUY",
      condition: "正常使用，续航良好",
      stock: 1,
      campus: "金明校区",
      image: henuItem1,
      description: "适合上课、跑步使用，支持现场试听和当面验货。",
      pickupLocation: "金明校区北门快递点",
      seller: { name: "陈同学", email: "chen@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=68", trustScore: 96, verified: true, department: "软件学院 · 2023级", reviews: 11, rating: 4.7 }
    },
    {
      id: "henu-item-2",
      title: "宿舍收纳置物架",
      category: "宿舍生活",
      stream: "living",
      price: 10,
      originalPrice: 28,
      mode: "BUY",
      condition: "九成新，无明显划痕",
      stock: 1,
      campus: "明伦校区",
      image: henuItem2,
      description: "桌面多层收纳架，毕业清理低价转让。",
      pickupLocation: "明伦校区南苑宿舍区",
      seller: { name: "刘同学", email: "liu@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=49", trustScore: 95, verified: true, department: "历史文化学院 · 2022级", reviews: 6, rating: 4.8 }
    },
    {
      id: "henu-item-3",
      title: "校园自行车",
      category: "出行工具",
      stream: "transport",
      price: 80,
      originalPrice: 260,
      mode: "BUY",
      condition: "可正常骑行，已调试",
      stock: 1,
      campus: "金明校区",
      image: henuItem3,
      description: "适合校内通勤，车锁和前后灯齐全，支持金明校区当面试骑。",
      pickupLocation: "金明校区东门",
      seller: { name: "孙同学", email: "sun@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=11", trustScore: 98, verified: true, department: "土木建筑学院 · 2023级", reviews: 14, rating: 4.9 }
    },
    {
      id: "henu-item-4",
      title: "考研台灯（护眼款）",
      category: "宿舍生活",
      stream: "living",
      price: 25,
      originalPrice: 79,
      mode: "EXCHANGE",
      condition: "使用半年，功能正常",
      stock: 1,
      campus: "明伦校区",
      image: henuItem4,
      description: "希望交换一套考研英语资料或同等价值的书籍。",
      exchangeWish: "优先交换英语、政治复习资料",
      pickupLocation: "明伦校区北苑宿舍区",
      seller: { name: "周同学", email: "zhou@henu.edu.cn", avatar: "https://i.pravatar.cc/160?img=5", trustScore: 97, verified: true, department: "经济学院 · 2022级", reviews: 9, rating: 4.8 }
    }
  ],
  services: [
    { id: "run-1", title: "校内代取快递", tagline: "跑腿服务", image: "https://images.unsplash.com/photo-1586528116493-da8b3a9b1d8c?w=800&auto=format&fit=crop&q=80", description: "金明、明伦校区内代取快递、代送资料，任务发布后由同校同学接单。", instructor: "可填写报酬 · 当日完成" },
    { id: "run-2", title: "图书馆占座与资料打印", tagline: "校园互助", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80", description: "发布临时帮忙需求，在线沟通地点、时间和报酬，完成后确认任务。", instructor: "支持金明 / 明伦校区" },
    { id: "run-3", title: "专业书单智能推荐", tagline: "河大同享 AI", image: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=800&auto=format&fit=crop&q=80", description: "输入专业、年级和课程，系统根据校园历史商品和人工书单推荐适合的教材。", instructor: "随机推荐 + 专业书单" }
  ],
  course: {
    title: "河南大学校园交易与跑腿指南",
    subtitle: "了解如何发布商品、沟通交易、选择安全交接点，并使用书籍推荐和跑腿服务。",
    heroImage: henuCampus,
    instructor: { name: "河大同享项目组", role: "金明与明伦校区运营团队", bio: "平台第一版围绕书籍交易展开，同时支持数码、宿舍用品、出行工具和跑腿任务。", image: "https://i.pravatar.cc/500?img=12", backpackImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80" },
    faqs: []
  },
  about: { headline: "让闲置物品在校园里继续发挥价值", subheadline: "河南大学金明、明伦校区二手交易与互助平台", copy: "从教材和专业书开始，连接同校买家、卖家和跑腿同学。", capImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80" },
  contact: { headline: "一起完善校园交易平台", subheadline: "欢迎提交书单、功能建议和跑腿需求。", deskImage: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1000&auto=format&fit=crop&q=80" }
};

if (typeof window !== 'undefined') window.CAMPUS_DATA = CAMPUS_DATA;
export default CAMPUS_DATA;
