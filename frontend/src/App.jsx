import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import CAMPUS_DATA from "./data/mockData";
// 路由级代码分割：业务视图与地图弹窗（含 Leaflet）按需加载，缩小首屏包体
const OverviewGatewayView = lazy(() => import("./components/OverviewGatewayView"));
const HomrPageIdeaView = lazy(() => import("./components/HomrPageIdeaView"));
const MarketplaceFullView = lazy(() => import("./components/MarketplaceView"));
const SellItemView = lazy(() => import("./components/SellItemView"));
const ServicesSection = lazy(() => import("./components/ServicesView"));
const CourseSection = lazy(() => import("./components/CourseView"));
const CartFullView = lazy(() => import("./components/CartView"));
const WishlistView = lazy(() => import("./components/WishListView"));
const MyAccountView = lazy(() => import("./components/MyAccountView"));
const OrderHistory = lazy(() => import("./components/OrderHistory"));
const CampusMapModal = lazy(() => import("./components/CampusMapModal"));
const SellerDashboard = lazy(() => import("./components/SellerDashboard"));
const CampusBot = lazy(() => import("./components/CampusBot"));
const NotificationBell = lazy(() => import("./components/NotificationBell"));
const ConversationView = lazy(() => import("./components/ConversationView"));
import {
  fetchProductsFromBackend,
  createProductOnBackend,
  updateProductOnBackend,
  deleteProductOnBackend,
  checkBackendHealth,
  getCurrentUser,
  loginUser,
  logoutUser,
  fetchCart,
  saveCart,
  fetchWishlist,
  saveWishlist,
  fetchOrders,
  checkoutOnBackend,
  cancelOrderOnBackend,
  getStoredToken,
  setStoredToken,
  registerUser,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createConversation,
} from "./services/api";

// 浮层退场保留：打开时即时返回 payload，关闭时保留 duration 后再卸载，并给出 closing 标记
function usePresence(payload, duration = 220) {
  const [retained, setRetained] = useState(null);
  const open = Boolean(payload);
  useEffect(() => {
    if (open) { setRetained(payload); return; }
    const timer = setTimeout(() => setRetained(null), duration);
    return () => clearTimeout(timer);
  }, [open, payload, duration]);
  const shown = open ? payload : retained;
  return { payload: shown, closing: Boolean(shown) && !open };
}

// 庆祝动效：canvas-confetti 按需加载并缓存，首屏不加载该依赖
let confettiLoaded = null;
function fireConfetti(options) {
  if (confettiLoaded) { confettiLoaded(options); return; }
  import("canvas-confetti").then((mod) => {
    confettiLoaded = mod.default;
    confettiLoaded(options);
  });
}

// 路由懒加载期间的骨架占位
function ViewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12" aria-busy="true" aria-label="页面加载中">
      <div className="skeleton h-8 w-52 rounded-card" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-64 rounded-panel" />)}
      </div>
    </div>
  );
}

// 只保留展示所需的用户摘要字段，绝不写入密码等敏感信息
function buildUserSummary(user) {
  if (!user) return null;

  return {
    id: user.id || user._id || user.userId || user.sub || null,
    email: user.email || "",
    name: user.name || "",
    roll: user.roll || "",
    department: user.department || user.dept || "",
    campus: user.campus || "",
    hostel: user.hostel || "",
    verified: user.verified !== false,
    trustScore: user.trustScore ?? null,
    legacyPasswordPending:
      user.legacyPasswordPending === true ||
      user.legacy_password_pending === true,
  };
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedCampusHub, setSelectedCampusHub] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Auth modal tab: "login" | "register"
  const [authTab, setAuthTab] = useState("login");
  // Register form fields (all schema fields)
  const [regName, setRegName] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regCampus, setRegCampus] = useState("河南大学金明校区");
  const [regLoading, setRegLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [conversationToOpen, setConversationToOpen] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastClosing, setToastClosing] = useState(false);
  const toastTimers = useRef({ inner: null, out: null });
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  // 学报版 v3：日刊 / 夜刊。用户选过则用 localStorage 'hdx-edition'，否则以系统深色偏好定初值。
  const [edition, setEdition] = useState(() => {
    const saved = localStorage.getItem("hdx-edition");
    if (saved === "night" || saved === "day") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "day";
  });
  const [productToOpen, setProductToOpen] = useState(null);
  const [mongoProducts, setMongoProducts] = useState(CAMPUS_DATA.products);
  const [dbStatus, setDbStatus] = useState("connecting"); // 'connected', 'offline', 'connecting'
  const [productsLoading, setProductsLoading] = useState(true);

  // MongoDB is the single source of truth for products.
  const allProducts = mongoProducts.length ? mongoProducts : CAMPUS_DATA.products;

  const getProductStock = (product) =>
    Math.max(0, Number(product?.stock) || 0);

  // 学报版 v3：把当前报刊写进 <html>，供 [data-theme="night"] 令牌接管
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", edition === "night");
    if (edition === "night") {
      root.setAttribute("data-theme", "night");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("hdx-edition", edition === "night" ? "night" : "day");
  }, [edition]);

  useEffect(() => {
    // Restore session from localStorage token (avoids CORS cookie issues)
    const restoreSession = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setAuthLoading(false);
          return;
        }

        // Try to get user from backend using stored token
        const result = await getCurrentUser();

        if (result?.success && result?.user) {
          setCurrentUser(buildUserSummary(result.user));
          setIsLoggedIn(true);
        } else if (result?.status === 401) {
          // 服务端判定会话失效（账号不存在或已注销）：立即清除本地凭据
          setStoredToken(null);
          try { localStorage.removeItem("campuscart-user"); } catch {}
          setCurrentUser(null);
          setIsLoggedIn(false);
        } else {
          // 仅在网络/服务异常时，才用本地缓存摘要做离线恢复
          const cached = (() => { try { return JSON.parse(localStorage.getItem("campuscart-user")); } catch { return null; } })();
          if (cached) {
            setCurrentUser(buildUserSummary(cached));
            setIsLoggedIn(true);
          } else {
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        }
      } catch (error) {
        console.error("Session restore failed:", error);
        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const [notifications, setNotifications] = useState([]);

  // 登录后拉取一次远端状态；此后按需刷新，不再每 5 秒全量轮询，
  // 避免定时覆盖本地乐观更新、造成闪烁与无谓请求。
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    async function loadRemoteState() {
      const [health, products, remoteCart, remoteWishlist, remoteOrders] = await Promise.all([
        checkBackendHealth(),
        fetchProductsFromBackend(),
        fetchCart(),
        fetchWishlist(),
        fetchOrders(),
      ]);
      if (!active) return;
      setDbStatus(health.connected ? "connected" : "offline");
      if (products.success) setMongoProducts(products.products.length ? products.products : CAMPUS_DATA.products);
      if (remoteCart.success) setCart(remoteCart.items || []);
      if (remoteWishlist.success) setWishlistItems(remoteWishlist.items || []);
      if (remoteOrders.success) setOrders(remoteOrders.orders || []);
    }
    loadRemoteState();
    return () => { active = false; };
  }, [isLoggedIn, location.pathname]);

  // 仅对通知做低频（30s）轮询，保留“新通知弹提示”，不再全量刷新其它状态。
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    async function pollNotifications() {
      const remoteNotifs = await fetchNotifications();
      if (!active || !remoteNotifs?.success) return;
      setNotifications((prev) => {
        const prevUnreadIds = new Set(prev.filter((n) => !n.read).map((n) => n.id));
        const newNotifs = remoteNotifs.data || [];
        const freshlyArrived = newNotifs.filter((n) => !n.read && !prevUnreadIds.has(n.id));
        if (freshlyArrived.length > 0 && prev.length > 0) {
          const first = freshlyArrived[0];
          showToast(`${first.title} — ${first.message}`);
        }
        return newNotifs;
      });
    }
    pollNotifications();
    const syncInterval = setInterval(pollNotifications, 30000);
    return () => { active = false; clearInterval(syncInterval); };
  }, [isLoggedIn]);

  // Open login dialog automatically when visiting /login
  useEffect(() => {
    if (location.pathname === "/login") {
      setIsLoginOpen(true);
    }
  }, [location.pathname]);

  // 键盘可达性：Esc 关闭当前最上层的弹窗 / 抽屉（地图弹窗自行处理）
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (qrModalItem) { setQrModalItem(null); return; }
      if (selectedSeller) { setSelectedSeller(null); return; }
      if (isLoginOpen) { setIsLoginOpen(false); return; }
      if (activeChat) { setActiveChat(null); return; }
      if (navMenuOpen) { setNavMenuOpen(false); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [qrModalItem, selectedSeller, isLoginOpen, activeChat, navMenuOpen]);

  // 浮层退场：保留最后一份数据，播放完退场动画再卸载
  const authPresence = usePresence(isLoginOpen);
  const sellerPresence = usePresence(selectedSeller);
  const chatPresence = usePresence(activeChat);

  // 认证面板完全卸载后再归位到「登录」页，避免退场途中内容突变
  useEffect(() => {
    if (!authPresence.payload) setAuthTab("login");
  }, [authPresence.payload]);

  // 路由切换：回到顶部，配合视图进场动画
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showToast = (msg) => {
    clearTimeout(toastTimers.current.inner);
    clearTimeout(toastTimers.current.out);
    setToastClosing(false);
    setToastMsg(msg);
    toastTimers.current.inner = setTimeout(() => {
      setToastClosing(true);
      toastTimers.current.out = setTimeout(() => setToastMsg(null), 220);
    }, 3300);
  };
  const addToWishlist = async (product) => {
    if (wishlistItems.some((item) => item.id === product.id)) return;
    const next = [...wishlistItems, { ...product, neededByMe: false }];
    setWishlistItems(next);
    const result = await saveWishlist(next);
    if (!result.success) { setWishlistItems(wishlistItems); showToast(`心愿单保存失败：${result.error}`); return; }
    showToast("已加入心愿单。");
  };

  const removeFromWishlist = async (productId) => {
    const next = wishlistItems.filter((product) => product.id !== productId);
    setWishlistItems(next);
    const result = await saveWishlist(next);
    if (!result.success) { setWishlistItems(wishlistItems); showToast(`心愿单更新失败：${result.error}`); return; }
    showToast("已从心愿单移除。");
  };

  const toggleNeededByMe = async (productId) => {
    const next = wishlistItems.map((product) => product.id === productId ? { ...product, neededByMe: !product.neededByMe } : product);
    setWishlistItems(next);
    const result = await saveWishlist(next);
    if (!result.success) setWishlistItems(wishlistItems);
  };

  const handleLogin = async (customEmail) => {
    const email = (customEmail || loginEmail || "").trim().toLowerCase();
    setAuthError("");

    // 前端先做基本校验，避免用空值去请求后端
    if (!email) {
      setAuthError("请输入河南大学邮箱。");
      return;
    }

    if (!loginPassword) {
      setAuthError("请输入密码。");
      return;
    }

    setLoginLoading(true);

    try {
      const result = await loginUser(email, loginPassword);

      // 登录失败：保留已输入的账号与密码，方便直接修改后重试
      if (!result?.success || !result?.user) {
        const loginErrorMessage = result?.error || "邮箱或密码不正确，请重试。";
        setAuthError(loginErrorMessage);
        showToast(loginErrorMessage);
        return;
      }

      const userObj = buildUserSummary(result.user);

      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setIsLoginOpen(false);
      setAuthError("");
      // 登录成功后立即清空密码输入框
      setLoginPassword("");

      // 只缓存用户摘要，密码等敏感信息不写入本地存储
      try { localStorage.setItem("campuscart-user", JSON.stringify(userObj)); } catch {}

      fireConfetti({ particleCount: 80, spread: 65, origin: { y: 0.5 } });

      navigate("/home");

      if (userObj.legacyPasswordPending) {
        showToast(
          "⚠️ 这是历史自动创建的账号，密码尚未认领。请切换到「注册」页用同一邮箱重设密码。"
        );
      } else {
        showToast(`🎉 欢迎回来，${userObj.roll || userObj.email}！`);
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "登录失败，请稍后重试。");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!regPassword) {
      showToast("❌ 请设置登录密码。");
      return;
    }
    if (regPassword.length < 6) {
      showToast("❌ 密码至少需要 6 位。");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError("两次输入的密码不一致。");
      return;
    }
    if (!regEmail.toLowerCase().endsWith("@henu.edu.cn")) {
      setAuthError("请使用河南大学邮箱（@henu.edu.cn）。");
      return;
    }
    setRegLoading(true);
    try {
      const result = await registerUser({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        name: regName.trim(),
        roll: regRoll.trim().toUpperCase(),
        department: regDepartment.trim(),
        campus: regCampus.trim(),
      });

      if (!result?.success || !result?.user) {
        setAuthError(result?.error || "注册失败，请更换邮箱或稍后重试。");
        setRegLoading(false);
        return;
      }

      const userObj = buildUserSummary(result.user);

      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setIsLoginOpen(false);
      setAuthError("");
      // 只缓存用户摘要，密码等敏感信息不写入本地存储
      try { localStorage.setItem("campuscart-user", JSON.stringify(userObj)); } catch {}
      // 注册成功后清空密码字段，避免敏感信息留在内存中
      setRegPassword("");
      setRegConfirmPassword("");

      fireConfetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      navigate("/home");
      showToast(
        result.message ||
          `🎉 欢迎加入河大同享，${userObj.name || userObj.roll}！账号已创建。`
      );
    } catch (error) {
      setAuthError(error.message || "注册失败，请稍后重试。");
    } finally {
      setRegLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    await markNotificationRead(notificationId);
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const handleLogout = async () => {
    await logoutUser(); // also clears token via setStoredToken(null)
    try { localStorage.removeItem("campuscart-user"); } catch {}
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCart([]);
    setWishlistItems([]);
    setOrders([]);
    setNotifications([]);
    setMongoProducts([]);
    // 退出时清空输入框中的密码，避免残留
    setLoginPassword("");
    setRegPassword("");
    setRegConfirmPassword("");
    setLoginLoading(false);
    navigate("/");
    showToast("👋 已退出登录。");
  };

  const navigateTo = (target) => {
    let path = target;
    if (target === "overview") path = "/";
    else if (!target.startsWith("/")) path = `/${target}`;
    if (path === "/course") path = "/courses";

    const publicPaths = ["/", "/marketplace", "/services", "/courses"];
    if (!isLoggedIn && !publicPaths.includes(path)) {
      setIsLoginOpen(true);
      showToast(
        "🔒 请先登录河南大学账号，再访问 " +
          path.replace("/", "").toUpperCase(),
      );
      return;
    }
    navigate(path);
    setNavMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = async (product, requestedQuantity = 1) => {
    const stock = getProductStock(product);
    const quantityToAdd = Math.max(1, Number(requestedQuantity) || 1);
    const existingItem = cart.find((item) => item.id === product.id);
    const currentQuantity = existingItem?.qty || 0;
    const availableToAdd = stock - currentQuantity;
    if (stock <= 0 || availableToAdd <= 0) { showToast(`「${product.title}」已售罄。`); return; }
    const finalQuantityToAdd = Math.min(quantityToAdd, availableToAdd);
    const sellerName = typeof product.seller === "object" ? product.seller?.name || "在校学生" : product.seller || "在校学生";
    const next = existingItem
      ? cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + finalQuantityToAdd } : item)
      : [...cart, { id: product.id, title: product.title, price: Number(product.price) || 0, qty: finalQuantityToAdd, image: product.image, seller: sellerName, pickupLocation: product.pickupLocation || "校园服务台" }];
    setCart(next);
    const result = await saveCart(next);
    if (!result.success) { setCart(cart); showToast(`购物车保存失败：${result.error}`); return; }
    showToast(`已将 ${finalQuantityToAdd} 件「${product.title}」加入购物车！`);
  };

  const refreshProducts = async () => {
    // 重试也要有加载反馈：否则点了「重试连接」界面毫无变化
    setProductsLoading(true);
    try {
      const result = await fetchProductsFromBackend();
      if (result.success) { setMongoProducts(result.products); setDbStatus("connected"); }
      else setDbStatus("offline");
      return result;
    } finally {
      setProductsLoading(false);
    }
  };

  const handlePublishProduct = async (newProduct) => {
    showToast("正在发布商品...");
    const result = await createProductOnBackend(newProduct);
    if (!result.success) {
      // Throw so SellItemView can keep the form filled and show the reason.
      throw new Error(result.error || "商品保存失败，请稍后重试。");
    }
    await refreshProducts();
    navigate("/marketplace");
    showToast("🟢 商品已保存。");
  };

  const handleEditProduct = async (updatedProduct) => {
    const result = await updateProductOnBackend(updatedProduct.id, updatedProduct);
    if (!result.success) { showToast(`❌ ${result.error}`); return; }
    await refreshProducts();
    showToast("🟢 商品已更新。");
  };

  const handleDeleteProduct = async (productId) => {
    const result = await deleteProductOnBackend(productId);
    if (!result.success) { showToast(`❌ ${result.error}`); return; }
    await refreshProducts();
    showToast("🗑️ 商品已删除。");
  };

  const persistCart = async (next) => {
    setCart(next);
    const result = await saveCart(next);
    if (!result.success) { setCart(cart); showToast(`购物车保存失败：${result.error}`); }
  };

  const increaseCartQuantity = (id) => {
    const item = cart.find((entry) => entry.id === id);
    const product = allProducts.find((entry) => entry.id === id);
    if (!item || !product) return;
    if (item.qty >= getProductStock(product)) { showToast(`「${item.title}」仅剩 ${getProductStock(product)} 件。`); return; }
    persistCart(cart.map((entry) => entry.id === id ? { ...entry, qty: entry.qty + 1 } : entry));
  };

  const decreaseCartQuantity = (id) => {
    persistCart(cart.map((entry) => entry.id === id ? { ...entry, qty: entry.qty - 1 } : entry).filter((entry) => entry.qty > 0));
  };

  const cancelOrder = async (orderId) => {
    const result = await cancelOrderOnBackend(orderId);
    if (!result.success) { showToast(`❌ ${result.error}`); return; }
    const refreshed = await fetchOrders();
    if (refreshed.success) setOrders(refreshed.orders);
    await refreshProducts();
    showToast("订单已取消，库存已恢复。");
  };

  const handlePublishListing = handlePublishProduct;

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("购物车是空的。"); return; }
    const result = await checkoutOnBackend(cart);
    if (!result.success) { showToast(`❌ ${result.error}`); await refreshProducts(); return; }
    setCart([]);
    setQrModalItem(result.data);
    setOrders((previous) => [result.data, ...previous]);
    await refreshProducts();
    fireConfetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    showToast(`🎉 订单 ${result.data.id} 已创建！`);
  };
  const startChat = async (seller, item) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      showToast("请先登录后再发起站内沟通。");
      return;
    }
    if (item?.id) {
      const result = await createConversation("product", item.id, seller?.id || seller?._id);
      if (result.success && result.conversation?.id) {
        setConversationToOpen(result.conversation.id);
        navigate("/conversations");
        return;
      }
      showToast(result.error || "无法创建会话，请确认后端和数据库已启动。");
    }
    // Keep the existing local preview available when the selected item is only a demo card.
    setActiveChat({
      seller,
      item,
      messages: [
        {
          sender: "seller",
          text: `你好！感谢咨询「${item.title}」。今天方便在校园服务台当面交易吗？`,
        },
      ],
    });
  };
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--paper)]">
      {/* =========================================================================
              FLOATING ISLAND PILL NAVBAR (Pre-Login vs Post-Login Responsive Modes)
             ========================================================================= */}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <header
          className={`floating-pill glass-dark pointer-events-auto flex items-center justify-between gap-3 whitespace-nowrap rounded-full px-4 py-2 text-white sm:gap-6 sm:px-6 sm:py-2.5 ${isLoggedIn ? "mx-auto w-full max-w-7xl" : "w-fit max-w-[calc(100%-2rem)]"}`}
        >
          {/* Minimal Geometric Logo */}
          <button
            onClick={() => navigateTo(isLoggedIn ? "/home" : "/")}
            className="press group flex flex-shrink-0 cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--plate-line-stronger)] text-xs text-white transition-transform duration-300 group-hover:rotate-45">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m4.93 4.93 4.24 4.24"></path>
                <path d="m14.83 9.17 4.24-4.24"></path>
                <path d="m14.83 14.83 4.24 4.24"></path>
                <path d="m9.17 14.83-4.24 4.24"></path>
              </svg>
            </div>
    <span className="font-display text-sm font-bold uppercase tracking-wider text-white">
              河大同享
            </span>
          </button>

          {/* Navigation Links inside Pill */}
          {isLoggedIn ? (
            <div className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-[var(--plate-fill-strong)] p-1 text-xs font-semibold sm:flex sm:gap-1.5">
              <button
                onClick={() => navigateTo("/home")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${location.pathname === "/home" ? "bg-white font-bold text-ink-950 shadow" : "text-[var(--meta)] hover:text-white"}`}
              >
                首页
              </button>
              <button
                onClick={() => navigateTo("/marketplace")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${location.pathname === "/marketplace" ? "bg-white font-bold text-ink-950 shadow" : "text-[var(--meta)] hover:text-white"}`}
              >
                二手市场
              </button>
              <button
                onClick={() => navigateTo("/sell")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${
                  location.pathname === "/sell"
                    ? "bg-white font-bold text-ink-950 shadow"
                    : "text-[var(--meta)] hover:text-white"
                }`}
              >
                发布商品
              </button>
              <button
                onClick={() => navigateTo("/services")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${location.pathname === "/services" ? "bg-white font-bold text-ink-950 shadow" : "text-[var(--meta)] hover:text-white"}`}
              >
                跑腿互助
              </button>
              <button
                onClick={() => navigateTo("/courses")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${location.pathname === "/courses" ? "bg-white font-bold text-ink-950 shadow" : "text-[var(--meta)] hover:text-white"}`}
              >
                专业书单
              </button>
              {/* 订单和收藏收进「我的」，不再单开入口（周期三：修复重复入口） */}
              <button
                onClick={() => navigateTo("/me")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${
                  location.pathname === "/me"
                    ? "bg-white font-bold text-ink-950 shadow"
                    : "text-[var(--meta)] hover:text-white"
                }`}
              >
                我的
              </button>
              <button
                onClick={() => navigateTo("/conversations")}
                className={`press rounded-full px-3 py-1 transition-all sm:px-3.5 sm:py-1 ${location.pathname === "/conversations" ? "bg-white font-bold text-ink-950 shadow" : "text-[var(--meta)] hover:text-white"}`}
              >
                私信
              </button>
            </div>
          ) : (
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-full bg-[var(--plate-fill-strong)] px-3.5 py-1 text-xs font-semibold sm:flex">
              <span className="pulse-ring h-2 w-2 rounded-full bg-[var(--success)] text-[var(--success)]"></span>
              <span className="font-bold tracking-wider text-white">
                平台总览
              </span>
              <span className="border-l border-[var(--plate-line-strong)] pl-1 font-mono text-[11px] text-[var(--meta)]">
                登录前预览
              </span>
            </div>
          )}

          {/* Right Menu / Cart & User Actions */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
            {/* 河南大学校区与交接点 */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="press relative flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--plate-line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--meta)] transition hover:border-[var(--plate-line-stronger)] hover:bg-[var(--plate-fill-strong)] hover:text-white"
              title="查看金明、明伦校区"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--on-ink)]"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span className="hidden font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--meta)] xl:inline">
                {selectedCampusHub ? selectedCampusHub.shortName : "校区"}
              </span>
            </button>

            {isLoggedIn && (
              <>
                <Suspense fallback={null}>
                <NotificationBell
                  notifications={notifications}
                  unreadCount={notifications.filter((n) => !n.read).length}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                />
                </Suspense>

                <button
                  onClick={() => navigateTo("cart")}
                  className="press relative flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-semibold text-[var(--meta)] transition hover:bg-[var(--plate-fill-strong)] hover:text-white"
                  title="购物车"
                  aria-label="购物车"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 8h14l1 13H4L5 8Z" />
                    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                  </svg>
                  {cart.length > 0 && (
                    <span key={cart.reduce((a, b) => a + b.qty, 0)} className="animate-pop flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-ink-950">
                      {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </button>
              </>
            )}

            {isLoggedIn ? (
              <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-[var(--plate-line)] bg-[var(--plate-fill-strong)] px-2.5 py-1 text-xs text-[var(--meta)] lg:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]"></span>
                  <span className="font-mono text-[11px] font-bold text-white">
                {currentUser?.roll || "2023012345"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="press flex flex-shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--plate-line-strong)] bg-[var(--plate-fill-strong)] px-3 py-1.5 text-xs font-medium text-[var(--on-ink)] transition hover:bg-[var(--plate-fill-stronger)] hover:text-white"
                  title="退出登录"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>退出登录</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="press flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-ink-950 shadow-sm transition hover:bg-white/90"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>校园账号登录</span>
              </button>
            )}

            {/* 学报版 v3：日刊 / 夜刊切换 */}
            <button
              onClick={() => setEdition(edition === "night" ? "day" : "night")}
              className="press flex cursor-pointer items-center gap-1 rounded-full p-1 text-[var(--meta)] transition hover:bg-[var(--plate-fill-strong)] hover:text-white"
              title={edition === "night" ? "切换为日刊" : "切换为夜刊"}
              aria-label={edition === "night" ? "切换为日刊" : "切换为夜刊"}
            >
              {edition === "night" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"></path>
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
                </svg>
              )}
            </button>

            {/* Hamburger dropdown toggle */}
            <button
              onClick={() => setNavMenuOpen(!navMenuOpen)}
              className="press cursor-pointer rounded-full p-1 text-[var(--meta)] transition hover:bg-[var(--plate-fill-strong)] hover:text-white"
              title="菜单"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="4" x2="20" y1="9" y2="9"></line>
                <line x1="4" x2="20" y1="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Mobile / Hamburger Overlay Menu */}
      {navMenuOpen && (
        <div className="on-ink animate-fade-up fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-ink-950/85 text-2xl font-display font-bold text-white backdrop-blur-md" role="dialog" aria-modal="true" aria-label="站点菜单">
          {!isLoggedIn && (
            <button
              onClick={() => {
                navigateTo("/");
                setNavMenuOpen(false);
              }}
              className="press transition hover:text-white"
            >
              总览 / 关于
            </button>          )}
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  navigateTo("/home");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
                           >
                首页
              </button>
              <button
                onClick={() => {
                  navigateTo("/marketplace");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
              >
                二手市场
              </button>
                <button
                onClick={() => {
                  navigateTo("/services");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
                >
                跑腿互助
                </button>
                <button
                onClick={() => {
                  navigateTo("/courses");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
                >
                专业书单
                </button>
                <button
                onClick={() => {
                  navigateTo("/cart");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
                >
                购物车 ({cart.length})
                </button>
                <button
                onClick={() => {
                  navigateTo("/me");
                  setNavMenuOpen(false);
                }}
                className="press transition hover:text-white"
                >
                我的
                </button>
                <button
                onClick={() => {
                  handleLogout();
                  setNavMenuOpen(false);
                }}
                className="press mt-4 rounded-full border border-danger-500/30 bg-danger-500/20 px-6 py-2 text-base text-danger-300"
                >
                退出登录
                </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsLoginOpen(true);
                setNavMenuOpen(false);
              }}
              className="press mt-4 rounded-full bg-white px-6 py-2 text-base text-ink-950"
            >
              学生登录
            </button>
          )}
          <button
            onClick={() => setNavMenuOpen(false)}
            className="press mt-6 font-sans text-sm uppercase tracking-widest text-[var(--meta)] transition hover:text-white"
          >
            ✕ 关闭菜单
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1">
        <div key={location.pathname} className="animate-view-in">
        <Suspense fallback={<ViewSkeleton />}>
        <Routes>
          <Route
            path="/"
            element={
              <OverviewGatewayView
                isLoggedIn={isLoggedIn}
                onOpenLogin={() => setIsLoginOpen(true)}
                onExplore={() => navigateTo("/marketplace")}
                onEnterHome={() => navigateTo("/home")}
                onAddToCart={addToCart}
                onOpenSeller={setSelectedSeller}
              />
            }
          />
          <Route
            path="/login"
            element={
              <OverviewGatewayView
                isLoggedIn={isLoggedIn}
                onOpenLogin={() => setIsLoginOpen(true)}
                onExplore={() => navigateTo("/marketplace")}
                onEnterHome={() => navigateTo("/home")}
                onAddToCart={addToCart}
                onOpenSeller={setSelectedSeller}
              />
            }
          />
          <Route
            path="/home"
            element={
              <HomrPageIdeaView
                products={allProducts}
                onExplore={() => navigateTo("/marketplace")}
                onAddToCart={addToCart}
                onOpenSeller={setSelectedSeller}
                onStartChat={startChat}
                onOpenQr={setQrModalItem}
                onOpenLogin={() => setIsLoginOpen(true)}
              />
            }
          />
          <Route
            path="/marketplace"
            element={
              <MarketplaceFullView
                products={allProducts}
                productsLoading={productsLoading}
                dbStatus={dbStatus}
                onRetryLoad={refreshProducts}
                onAddToCart={addToCart}
                onOpenSeller={setSelectedSeller}
                onStartChat={startChat}
                onOpenQr={setQrModalItem}
                onSellItem={() => navigateTo("/sell")}
                onAddToWishlist={addToWishlist}
                onRemoveFromWishlist={removeFromWishlist}
                wishlistItems={wishlistItems}
                initialProduct={productToOpen}
              />
            }
          />
          <Route
  path="/sell"
  element={
    <SellItemView
      currentUser={currentUser}
      onBack={() => navigateTo("/marketplace")}
      onPublish={handlePublishProduct}
    />
  }
/>
          <Route
            path="/orders"
            element={
              <OrderHistory
                orders={orders}
                onBack={() => navigateTo("/marketplace")}
                onCancelOrder={cancelOrder}
              />
            }
          />
          <Route
            path="/me"
            element={
              <MyAccountView
                orders={orders}
                wishlistItems={wishlistItems}
                products={allProducts}
                currentUser={currentUser}
                onBack={() => navigateTo("/marketplace")}
                onOpenProduct={(product) => {
                  setProductToOpen(product);
                  navigateTo("/marketplace");
                }}
                onRemoveFromWishlist={removeFromWishlist}
                onToggleNeeded={toggleNeededByMe}
                onCancelOrder={cancelOrder}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
            }
          />
          <Route
            path="/wishlist"
            element={
              <WishlistView
                wishlistItems={wishlistItems}
                onBack={() => navigateTo("/marketplace")}
                onOpenProduct={(product) => {
                  setProductToOpen(product);
                  navigateTo("/marketplace");
                }}
                onRemove={removeFromWishlist}
                onToggleNeeded={toggleNeededByMe}
              />
            }
          />
          <Route
            path="/services"
            element={
              <ServicesSection
                onNotify={(message) => showToast(message)}
                isLoggedIn={isLoggedIn}
                onRequireLogin={() => setIsLoginOpen(true)}
              />
            }
          />
          <Route
            path="/courses"
            element={
              <CourseSection
                onEnroll={() =>
                  showToast("已加入专业书单！")
                }
              />
            }
          />
          <Route
            path="/conversations"
            element={<ConversationView initialConversationId={conversationToOpen} />}
          />
          <Route
            path="/cart"
            element={
              <CartFullView
                cart={cart}
                onRemove={(id) => persistCart(cart.filter((item) => item.id !== id))}
                onIncrease={increaseCartQuantity}
                onDecrease={decreaseCartQuantity}
                onContinue={() => navigateTo("/marketplace")}
                onCheckout={handleCheckout}
              />
            }
          />

          <Route
  path="/seller-dashboard"
  element={
    <SellerDashboard
      products={allProducts}
      currentUser={currentUser}
      onDeleteProduct={handleDeleteProduct}
      onEditProduct={handleEditProduct}
      notifications={notifications}
      onMarkRead={handleMarkNotificationRead}
      onMarkAllRead={handleMarkAllNotificationsRead}
    />
  }
/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </div>
      </main>

      {/* =========================================================================
              CLEAN EDITORIAL FOOTER WITH FROSTED WATERMARK (Video Timestamp 00:13 - 00:18)
             ========================================================================= */}
      <footer className="on-ink hero-light relative overflow-hidden border-t border-[var(--plate-line)] bg-ink-950 px-6 pb-12 pt-20 text-white sm:px-12">
        {/* 页脚大字水印：河大同享 */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-center opacity-10">
          <span className="hero-watermark whitespace-nowrap uppercase">
            河大同享
          </span>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 border-b border-[var(--plate-line)] pb-16 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="display-3 flex items-center gap-2">
              <span className="h-3 w-3 animate-ping rounded-full bg-[var(--success)]"></span>
              河大同享 · 校园交易与互助
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--meta)]">
              服务河南大学金明、明伦校区。以教材和专业书交易为重点，支持二手物品、站内沟通、校园跑腿与书籍推荐。
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-[var(--meta)]">
              <span className="rounded-full border border-[var(--plate-line)] bg-[var(--plate-fill)] px-3 py-1">
                河南大学校园
              </span>
              <span className="rounded-full border border-[var(--plate-line)] bg-[var(--plate-fill)] px-3 py-1">
                校内当面交接
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--meta)]">
              商品分类
            </h4>
            <ul className="space-y-2 text-sm text-[var(--meta)]">
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="press transition hover:text-white"
                >
                  工程制图工具
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="press transition hover:text-white"
                >
                  计算器
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="press transition hover:text-white"
                >
                  实验手册与笔记
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="press transition hover:text-white"
                >
                  宿舍生活用品
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="press transition hover:text-white"
                >
                  校园自行车
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--meta)]">
              交易与安全
            </h4>
            <ul className="space-y-2 text-sm text-[var(--meta)]">
              <li>
                <a href="#" className="press transition hover:text-white">
                  图书馆服务台
                </a>
              </li>
              <li>
                <a href="#" className="press transition hover:text-white">
                  食堂见面区
                </a>
              </li>
              <li>
                <a href="#" className="press transition hover:text-white">
                  宿舍楼值班台
                </a>
              </li>
              <li>
                <a href="#" className="press transition hover:text-white">
                  信用评分
                </a>
              </li>
              <li>
                <a href="#" className="press transition hover:text-white">
                  二维码核验
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 pt-8 text-xs text-[var(--muted)] sm:flex-row">
          <div>© 2026 河大同享 · 河南大学校园二手交易与互助平台</div>
          <div className="flex gap-6">
            <a href="#" className="press transition hover:text-white">
              隐私政策
            </a>
            <a href="#" className="press transition hover:text-white">
              学生行为规范
            </a>
            <a href="#" className="press transition hover:text-white">
              校园安全热线
            </a>
          </div>
        </div>
      </footer>

      {/* =========================================================================
              MODAL: AUTH — Login & Register (Glassmorphic Apple Style)
             ========================================================================= */}
      {authPresence.payload && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-md ${authPresence.closing ? "animate-fade-out pointer-events-none" : "animate-fade-in"}`} role="dialog" aria-modal="true" aria-labelledby="od-auth-title">
          <div className="relative w-full max-w-md">
            {/* Glass card */}
            <div className={`${authPresence.closing ? "animate-scale-out" : "animate-scale-in"} relative overflow-hidden rounded-panel border border-[var(--hairline)] bg-white shadow-float`}>

              {/* Close */}
              <button onClick={() => setIsLoginOpen(false)} aria-label="关闭" className="press absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl leading-none text-[var(--meta)] transition hover:bg-[var(--surface)] hover:text-ink-950">×</button>

              {/* Header */}
              <div className="px-8 pb-0 pt-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-[var(--surface)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 id="od-auth-title" className="display-3 mb-1 text-ink-950">
                  {authTab === "login" ? "欢迎回来" : "加入河大同享"}
                </h3>
                <p className="mb-6 text-sm text-[var(--muted)]">
                  {authTab === "login" ? "使用河南大学校园邮箱登录" : "注册河大同享校园交易账号"}
                </p>
              </div>

              {/* Tabs */}
              <div className="mb-6 px-8">
                <div className="flex gap-1 rounded-field bg-[var(--surface)] p-1">
                  {["login","register"].map((tab) => (
                    <button key={tab} onClick={() => setAuthTab(tab)} className={`press flex-1 rounded-field py-2.5 text-sm font-semibold transition-all duration-200 ${authTab === tab ? "bg-white text-ink-950 shadow-sm" : "text-[var(--muted)] hover:text-ink-950"}`}>
                      {tab === "login" ? "登录" : "注册"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── LOGIN ── */}
              {authTab === "login" && (
                <div className="px-8 pb-8">
                  <form onSubmit={(e) => { e.preventDefault(); handleLogin(loginEmail); }} className="space-y-4">
                    {[
                      { label:"河南大学邮箱", type:"email", val:loginEmail, set:setLoginEmail, ph:"学号@henu.edu.cn" },
                      { label:"密码", type:"password", val:loginPassword, set:setLoginPassword, ph:"••••••••" },
                    ].map(({ label, type, val, set, ph }) => (
                      <div key={label}>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">{label}</label>
                        <input type={type} required autoFocus={type === "email"} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                          className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                        />
                      </div>
                    ))}
                    {authError && (
                      <p role="alert" className="rounded-field border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                        {authError}
                      </p>
                    )}
                    <button type="submit" disabled={loginLoading} className="press mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:cursor-not-allowed disabled:opacity-70">
                      {loginLoading ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          正在验证…
                        </>
                      ) : (
                        "登录 →"
                      )}
                    </button>
                  </form>
                  <p className="mt-5 text-center text-xs text-[var(--meta)]">
                    还没有账号？{" "}<button onClick={() => setAuthTab("register")} className="press font-semibold text-[var(--accent)] transition hover:text-[var(--accent-active)]">立即注册</button>
                  </p>
                </div>
              )}

              {/* ── REGISTER ── */}
              {authTab === "register" && (
                <div className="custom-scroll max-h-[62vh] overflow-y-auto px-8 pb-8">
                  <form onSubmit={handleRegister} className="space-y-4">

                    {/* 历史账号提示 */}
                    <p className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200">
                      如果你是早期自动创建的历史账号，忘记原密码也没关系：在这里用同一个邮箱重新设置密码即可完成认领，原有商品和订单都会保留。
                    </p>

                    {/* Simple text/email fields */}
                    {[
                      { label:"姓名",    req:true,  type:"text",     val:regName,     set:setRegName,     ph:"例如：李明" },
                      { label:"学号",  req:true,  type:"text",     val:regRoll,     set:setRegRoll,     ph:"例如：2023012345" },
                    ].map(({ label, req, type, val, set, ph }) => (
                      <div key={label}>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">{label} {req && <span className="text-[var(--danger)]">*</span>}</label>
                        <input type={type} required={req} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                          className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                        />
                      </div>
                    ))}

                    {/* College Email with auto-fill */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">河南大学邮箱 <span className="text-[var(--danger)]">*</span></label>
                      <input type="email" required value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); const p=e.target.value.split("@")[0]; if(p && !regRoll) setRegRoll(p.toUpperCase()); }}
                        placeholder="学号@henu.edu.cn"
                        className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                      />
                      <p className="ml-1 mt-1.5 text-[11px] text-[var(--meta)]">请填写河南大学邮箱地址</p>
                    </div>

                    {/* 学院下拉（河南大学院系） */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">学院 <span className="text-[var(--danger)]">*</span></label>
                      <select required value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full appearance-none rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15">
                        <option value="">请选择学院…</option>
                        {["计算机与信息工程学院","软件学院","人工智能学院","数学与统计学院","物理与电子学院","化学化工学院","生命科学学院","材料学院","土木建筑学院","经济学院","商学院","法学院","文学院","历史文化学院","教育学部","新闻与传播学院","外国语学院","音乐学院","美术学院","体育学院","药学院","护理与健康学院","国际教育学院","其他"].map(d=>(
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campus */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">校区</label>
                      <input type="text" value={regCampus} onChange={(e) => setRegCampus(e.target.value)} placeholder="河南大学金明校区 / 明伦校区"
                        className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">密码 <span className="text-[var(--danger)]">*</span></label>
                      <input type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="至少 6 位字符"
                        className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--fg-2)]">确认密码 <span className="text-[var(--danger)]">*</span></label>
                      <input type="password" required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="再次输入密码"
                        className="w-full rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--meta)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
                        style={{ borderColor: regConfirmPassword && regPassword !== regConfirmPassword ? "var(--danger)" : undefined }}
                      />
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="ml-1 mt-1.5 text-[11px] text-[var(--danger)]">两次输入的密码不一致</p>
                      )}
                    </div>

                    {authError && (
                      <p role="alert" className="rounded-field border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                        {authError}
                      </p>
                    )}

                    <button type="submit" disabled={regLoading}
                      className="press mt-2 w-full cursor-pointer rounded-full bg-[var(--accent)] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:opacity-50">
                      {regLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                          正在创建账号…
                        </span>
                      ) : "创建账号 →"}
                    </button>
                  </form>
                  <p className="mt-5 text-center text-xs text-[var(--meta)]">
                    已有账号？{" "}<button onClick={() => setAuthTab("login")} className="press font-semibold text-[var(--accent)] transition hover:text-[var(--accent-active)]">去登录</button>
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
              MODAL: SELLER TRUST PROFILE
             ========================================================================= */}
      {sellerPresence.payload && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-md ${sellerPresence.closing ? "animate-fade-out pointer-events-none" : "animate-fade-in"}`} role="dialog" aria-modal="true" aria-labelledby="od-seller-title">
          <div className={`${sellerPresence.closing ? "animate-scale-out" : "animate-scale-in"} relative w-full max-w-md rounded-panel bg-white p-8 shadow-panel`}>
            <button
              onClick={() => setSelectedSeller(null)}
              className="press absolute right-6 top-6 text-2xl leading-none text-[var(--meta)] transition hover:text-ink-950"
            >
              &times;
            </button>
            <div className="mb-6 flex items-center gap-4">
              <img
                src={sellerPresence.payload.avatar}
                className="h-16 w-16 rounded-card border-2 border-ink-900 object-cover"
                alt="" loading="lazy" decoding="async" />
              <div>
                <h4 id="od-seller-title" className="font-display text-xl font-black tracking-tight text-ink-950">
                  {sellerPresence.payload.name}
                </h4>
                <p className="text-xs text-[var(--muted)]">
                  {sellerPresence.payload.department}
                </p>
                <span className="mt-1 inline-block rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                  已认证学生
                </span>
              </div>
            </div>

            <div className="mb-4 space-y-2 rounded-card border border-[var(--hairline)] bg-[var(--paper-2)] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--fg-2)]">
                  同学互信评分
                </span>
                <span className="text-sm font-black text-[var(--accent)]">
                  {sellerPresence.payload.trustScore} / 100
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ink-100)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${sellerPresence.payload.trustScore}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-[var(--meta)]">
                基于举报记录、当面交接次数与同学评价综合计算。
              </p>
            </div>

            <button
              onClick={() => {
                startChat(sellerPresence.payload, { title: "卖家咨询" });
                setSelectedSeller(null);
              }}
              className="press w-full rounded-field bg-ink-950 py-3 text-xs font-bold text-white transition hover:bg-ink-800"
            >
              发送站内消息
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
              DRAWER: REAL-TIME BUYER-SELLER CHAT
             ========================================================================= */}
      {chatPresence.payload && (
        <div className={`${chatPresence.closing ? "animate-drawer-out" : "animate-drawer-in"} fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--hairline)] bg-[var(--paper)] shadow-panel sm:w-96`} role="dialog" aria-modal="true" aria-label={`与 ${chatPresence.payload.seller?.name || "卖家"} 的站内消息`}>
          <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--paper-2)] p-4">
            <div className="flex items-center gap-3">
              <img
                src={chatPresence.payload.seller.avatar}
                className="h-9 w-9 rounded-full object-cover"
                alt="" loading="lazy" decoding="async" />
              <div>
                <h4 className="text-sm font-bold text-[var(--fg)]">
                  {chatPresence.payload.seller.name}
                </h4>
                <p className="max-w-[180px] truncate text-[11px] text-[var(--muted)]">
                  关于：{chatPresence.payload.item.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveChat(null)}
              className="press text-2xl text-[var(--meta)] transition hover:text-[var(--fg)]"
            >
              &times;
            </button>
          </div>

          <div className="custom-scroll flex-1 space-y-3 overflow-y-auto bg-[var(--paper-2)] p-4 text-xs">
            <div className="py-1 text-center text-[11px] text-[var(--meta)]">
              🔒 校内认证同学对话
            </div>
            {chatPresence.payload.messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-card p-3 leading-relaxed ${m.sender === "buyer" ? "rounded-br-none bg-ink-950 text-white" : "rounded-bl-none border border-[var(--hairline)] bg-white text-ink-800"}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const inp = e.target.elements.chatMsg;
              if (!inp.value.trim()) return;
              const text = inp.value;
              setActiveChat((prev) => ({
                ...prev,
                messages: [...prev.messages, { sender: "buyer", text }],
              }));
              inp.value = "";
              setTimeout(() => {
                setActiveChat((prev) =>
                  prev
                    ? {
                        ...prev,
                        messages: [
                          ...prev.messages,
                          {
                            sender: "seller",
                            text: "成交！我下午 4 点会把物品带到图书馆服务台。",
                          },
                        ],
                      }
                    : null,
                );
              }, 1100);
            }}
            className="flex gap-2 border-t border-[var(--hairline)] bg-white p-3"
          >
            <input
              name="chatMsg"
              type="text"
              placeholder="输入消息或出价..."
              className="flex-1 rounded-field border border-[var(--hairline)] bg-[var(--paper-2)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              className="press rounded-field bg-ink-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-ink-800"
            >
              发送
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
              MODAL: QR PICKUP VERIFICATION
             ========================================================================= */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="od-qr-title">
          <div className="animate-scale-in relative w-full max-w-sm space-y-4 rounded-panel bg-white p-6 text-center shadow-panel">
            <button
              onClick={() => setQrModalItem(null)}
              className="press absolute right-4 top-4 text-2xl leading-none text-[var(--meta)] transition hover:text-ink-950"
            >
              &times;
            </button>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
              安全交接凭证
            </span>
            <h3 id="od-qr-title" className="font-display text-xl font-black tracking-tight text-ink-950">
              订单 #{qrModalItem.id}
            </h3>
            <p>
              请在{" "}
              <strong>
                {qrModalItem.pickupLocation || "校园服务台"}
              </strong>
              出示此二维码。
            </p>
            <div className="inline-block rounded-card border border-[var(--hairline)] bg-[var(--paper-2)] p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HENUTONGXIANG-PICKUP-${qrModalItem.id}`}
                alt="取货二维码"
                className="mx-auto h-36 w-36 rounded-lg" loading="lazy" decoding="async" />
            </div>

            <div className="font-mono text-[11px] text-[var(--meta)]">
              凭证 #CP-{Math.floor(1000 + Math.random() * 9000)}
            </div>

            <button
              onClick={() => {
                fireConfetti({ particleCount: 80, spread: 60 });
                setQrModalItem(null);
                showToast(
                  "🎉 二维码核验完成！买卖双方信用评分已提升。",
                );
              }}
              className="press w-full rounded-field bg-[var(--accent)] py-2.5 text-xs font-bold text-white transition hover:bg-[var(--accent-hover)]"
            >
              模拟完成二维码核验
            </button>
          </div>
        </div>
      )}

      {/* 河南大学校区地图 */}
      <Suspense fallback={null}>
      <CampusMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectCampus={(college) => {
          setSelectedCampusHub(college);
          showToast(`📍 当前校区已设为：${college.name}`);
        }}
      />
      </Suspense>

      {/* CUTE INTERACTIVE DRAGGABLE CAMPUS BOT */}
      <Suspense fallback={null}>
      <CampusBot
        currentUser={currentUser}
        onNavigate={navigateTo}
        allProducts={allProducts}
      />
      </Suspense>

      {/* TOAST POPUP */}
      {toastMsg && (
        <div className={`glass-dark ${toastClosing ? "animate-toast-out" : "animate-fade-up"} fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-card px-5 py-3 text-xs font-bold text-white shadow-float`}>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export default App;
