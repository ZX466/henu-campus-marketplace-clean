// 河南大学校园地图数据：金明校区与明伦校区位置和建议交接点。
// 经纬度用于校园地图展示；具体交接点由交易双方在站内沟通确认。
export const CAMPUS_MAP_CONFIG = {
  center: [34.811, 114.323],
  defaultZoom: 13,
  minZoom: 11,
  maxZoom: 19
};

// 校区分类标签：全部 / 书籍专区 / 二手物品
export const CAMPUS_STREAMS = [
  { id: "all", label: "全部校区", icon: "school" },
  { id: "book", label: "书籍专区", icon: "book" },
  { id: "goods", label: "二手物品", icon: "package" }
];

// 校区范围（仅河南大学金明校区与明伦校区）
export const CAMPUS_ZONES = [
  {
    id: "all",
    name: "河南大学校园",
    short: "全部校区",
    color: "#14b8a6",
    center: [34.811, 114.323],
    zoom: 13,
    description: "河南大学金明、明伦校区校园交易与互助服务范围。"
  },
  {
    id: "jinming",
    name: "金明校区",
    short: "金明校区",
    color: "#6366f1",
    center: [34.822, 114.295],
    zoom: 15,
    description: "金明校区图书馆、生活服务中心和校门周边交接点。"
  },
  {
    id: "minglun",
    name: "明伦校区",
    short: "明伦校区",
    color: "#10b981",
    center: [34.799, 114.346],
    zoom: 15,
    description: "明伦校区大礼堂、宿舍区和校园公共区域交接点。"
  }
];

// 校区列表（仅金明校区与明伦校区）
export const HENU_CAMPUSES = [
  {
    id: "jinming",
    name: "河南大学金明校区",
    shortName: "金明校区",
    stream: "book",
    zoneId: "jinming",
    city: "开封市",
    district: "河南大学金明校区",
    pincode: "475004",
    lat: 34.822,
    lng: 114.295,
    activeStudents: 0,
    listingsCount: 0,
    avgMeetupTime: "双方协商",
    seniorHandoverAvailable: true,
    eLogisticsHubAvailable: false,
    primaryPickup: "图书馆门口",
    pickupPoints: ["图书馆门口", "生活服务中心", "东门公共区域"],
    highlight: "第一期服务校区。商品数量、交接时间和地点以平台实际信息及双方沟通为准。"
  },
  {
    id: "minglun",
    name: "河南大学明伦校区",
    shortName: "明伦校区",
    stream: "goods",
    zoneId: "minglun",
    city: "开封市",
    district: "河南大学明伦校区",
    pincode: "475001",
    lat: 34.799,
    lng: 114.346,
    activeStudents: 0,
    listingsCount: 0,
    avgMeetupTime: "双方协商",
    seniorHandoverAvailable: true,
    eLogisticsHubAvailable: false,
    primaryPickup: "大礼堂东门",
    pickupPoints: ["大礼堂东门", "南苑宿舍区公共区域", "校园公共服务点"],
    highlight: "第一期服务校区。请在站内沟通确认交易时间与交接位置。"
  }
];

// 交接方式说明
export const DELIVERY_MODES = {
  IN_CAMPUS: {
    id: "in-campus",
    title: "校内当面交接",
    badge: "双方沟通确认",
    cost: "双方协商",
    eta: "按约定时间",
    icon: "zap",
    security: "建议选择校园公共区域",
    description: "买卖双方通过站内沟通确定时间和地点，现场确认物品后完成交接。"
  },
  OUT_OF_CAMPUS: {
    id: "out-of-campus",
    title: "跑腿互助",
    badge: "校内同学接单",
    cost: "发布任务时填写",
    eta: "按约定时间",
    icon: "truck",
    security: "任务双方站内联系",
    description: "发布代取快递、代送资料等跑腿需求，由校内同学沟通接单。"
  }
};
