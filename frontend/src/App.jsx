import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import confetti from "canvas-confetti";
import VideoShowcase from "./components/VideoShowcase";
import CircularWheelShowcase from "./components/CircularWheelShowcase";
import OverviewGatewayView from "./components/OverviewGatewayView";
import HomrPageIdeaView from "./components/HomrPageIdeaView";
import MarketplaceFullView from "./components/MarketplaceView";
import SellItemView from "./components/SellItemView";
import ServicesSection from "./components/ServicesView";
import CourseSection from "./components/CourseView";
import CartFullView from "./components/CartView";
import WishlistView from "./components/WishListView.jsx";
import OrderHistory from "./components/OrderHistory";
import CampusMapModal from "./components/CampusMapModal";
import SellerDashboard from "./components/SellerDashboard.jsx";
import CampusBot from "./components/CampusBot.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import ConversationView from "./components/ConversationView.jsx";
import CAMPUS_DATA from "./data/mockData";
import {
  fetchProductsFromBackend,
  createProductOnBackend,
  updateProductOnBackend,
  deleteProductOnBackend,
  checkBackendHealth,
  loginUserOnBackend,
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
  const [activeChat, setActiveChat] = useState(null);
  const [conversationToOpen, setConversationToOpen] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [productToOpen, setProductToOpen] = useState(null);
  const [mongoProducts, setMongoProducts] = useState(CAMPUS_DATA.products);
  const [dbStatus, setDbStatus] = useState("connecting"); // 'connected', 'offline', 'connecting'

  // MongoDB is the single source of truth for products.
  const allProducts = mongoProducts.length ? mongoProducts : CAMPUS_DATA.products;

  const getProductStock = (product) =>
    Math.max(0, Number(product?.stock) || 0);

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
          const user = result.user;
          setCurrentUser({
            ...user,
            id: user.id || user._id || user.userId || user.sub,
          });
          setIsLoggedIn(true);
        } else {
          // Token exists but backend down — restore from localStorage cache
          const cached = (() => { try { return JSON.parse(localStorage.getItem("campuscart-user")); } catch { return null; } })();
          if (cached) {
            setCurrentUser(cached);
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

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    async function loadRemoteState() {
      const [health, products, remoteCart, remoteWishlist, remoteOrders, remoteNotifs] = await Promise.all([
        checkBackendHealth(),
        fetchProductsFromBackend(),
        fetchCart(),
        fetchWishlist(),
        fetchOrders(),
        fetchNotifications(),
      ]);
      if (!active) return;
      setDbStatus(health.connected ? "connected" : "offline");
      if (products.success) setMongoProducts(products.products.length ? products.products : CAMPUS_DATA.products);
      if (remoteCart.success) setCart(remoteCart.items || []);
      if (remoteWishlist.success) setWishlistItems(remoteWishlist.items || []);
      if (remoteOrders.success) setOrders(remoteOrders.orders || []);
      if (remoteNotifs?.success) {
        // If there are newly arrived unread notifications, alert the user with a toast
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
    }
    loadRemoteState();
    const syncInterval = setInterval(loadRemoteState, 5000);
    return () => { active = false; clearInterval(syncInterval); };
  }, [isLoggedIn, location.pathname]);

  // Open login dialog automatically when visiting /login
  useEffect(() => {
    if (location.pathname === "/login") {
      setIsLoginOpen(true);
    }
  }, [location.pathname]);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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
    const email = customEmail || loginEmail;

    try {
      const result = await loginUser(
        email,
        loginPassword || "campuscart-demo-password"
      );

      if (!result?.success || !result?.user) {
        showToast(result?.error || "登录失败。");
        return;
      }

      const user = result.user;
      const userObj = {
        ...user,
        id: user.id || user._id || user.userId || user.sub,
      };

      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setIsLoginOpen(false);

      // Cache user in localStorage for session restore on page refresh
      try { localStorage.setItem("campuscart-user", JSON.stringify(userObj)); } catch {}

      if (window.confetti) {
        window.confetti({ particleCount: 80, spread: 65, origin: { y: 0.5 } });
      }

      navigate("/home");

      showToast(
        `🎉 Authenticated as ${
          user.roll || user.email
        }！欢迎来到河大同享。`
      );
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "登录失败。");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      showToast("❌ 两次输入的密码不一致。");
      return;
    }
    if (!regEmail.toLowerCase().endsWith("@henu.edu.cn")) {
      showToast("❌ 请使用河南大学邮箱（@henu.edu.cn）。");
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
        showToast(result?.error || "注册失败。");
        setRegLoading(false);
        return;
      }

      const user = result.user;
      const userObj = { ...user, id: user.id || user._id || user.userId || user.sub };

      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setIsLoginOpen(false);
      try { localStorage.setItem("campuscart-user", JSON.stringify(userObj)); } catch {}

      if (window.confetti) {
        window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
      navigate("/home");
      showToast(`🎉 欢迎加入河大同享，${user.name || user.roll}！账号已创建。`);
    } catch (error) {
      showToast(error.message || "注册失败。");
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
    const result = await fetchProductsFromBackend();
    if (result.success) { setMongoProducts(result.products); setDbStatus("connected"); }
    else setDbStatus("offline");
    return result;
  };

  const handlePublishProduct = async (newProduct) => {
    showToast("正在发布商品...");
    const result = await createProductOnBackend(newProduct);
    if (!result.success) { showToast(`❌ ${result.error}`); return; }
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
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
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
    <div className="relative min-h-screen flex flex-col bg-[#fcfcfd]">
      {/* =========================================================================
              FLOATING ISLAND PILL NAVBAR (Pre-Login vs Post-Login Responsive Modes)
             ========================================================================= */}
      <div className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <header
          className={`floating-pill text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-2xl flex items-center justify-between gap-3 sm:gap-6 pointer-events-auto whitespace-nowrap ${isLoggedIn ? "w-full max-w-7xl mx-auto" : "w-fit max-w-[calc(100%-2rem)]"}`}
        >
          {/* Minimal Geometric Logo */}
          <button
            onClick={() => navigateTo(isLoggedIn ? "/home" : "/")}
            className="flex items-center gap-2.5 group cursor-pointer flex-shrink-0"
          >
            <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-white text-xs group-hover:rotate-45 transition-transform duration-300">
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
    <span className="font-display font-bold text-sm tracking-wider uppercase text-white">
              河大同享
            </span>
          </button>

          {/* Navigation Links inside Pill */}
          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 bg-white/10 p-1 rounded-full text-xs font-semibold flex-shrink-0">
              <button
                onClick={() => navigateTo("/home")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${location.pathname === "/home" ? "bg-white text-black font-bold shadow" : "text-neutral-300 hover:text-white"}`}
              >
                首页
              </button>
              <button
                onClick={() => navigateTo("/marketplace")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${location.pathname === "/marketplace" ? "bg-white text-black font-bold shadow" : "text-neutral-300 hover:text-white"}`}
              >
                二手市场
              </button>
              <button
                onClick={() => navigateTo("/sell")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${
                  location.pathname === "/sell"
                    ? "bg-white text-black font-bold shadow"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                发布商品
              </button>
              <button
                onClick={() => navigateTo("/services")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${location.pathname === "/services" ? "bg-white text-black font-bold shadow" : "text-neutral-300 hover:text-white"}`}
              >
                跑腿互助
              </button>
              <button
                onClick={() => navigateTo("/courses")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${location.pathname === "/courses" ? "bg-white text-black font-bold shadow" : "text-neutral-300 hover:text-white"}`}
              >
                专业书单
              </button>
              <button
                onClick={() => navigateTo("/orders")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${
                  location.pathname === "/orders"
                    ? "bg-white font-bold text-black shadow"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                我的订单
              </button>
              <button
                onClick={() => navigateTo("/wishlist")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${
                  location.pathname === "/wishlist"
                    ? "bg-white text-black font-bold shadow"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                心愿单
              </button>
              <button
                onClick={() => navigateTo("/conversations")}
                className={`px-3 py-1 sm:px-3.5 sm:py-1 rounded-full transition-all ${location.pathname === "/conversations" ? "bg-white text-black font-bold shadow" : "text-neutral-300 hover:text-white"}`}
              >
                私信
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full text-xs font-semibold flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-bold tracking-wider">
                平台总览
              </span>
              <span className="text-[10px] text-neutral-400 font-mono pl-1 border-l border-white/20">
                登录前预览
              </span>
            </div>
          )}

          {/* Right Menu / Cart & User Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* 河南大学校区与交接点 */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="relative text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 font-semibold transition px-2.5 py-1.5 rounded-full hover:bg-white/10 flex-shrink-0 cursor-pointer border border-white/10 hover:border-teal-400/40"
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
                className="text-teal-400"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span className="hidden xl:inline text-[11px] font-mono text-teal-300 font-bold uppercase tracking-wider">
                {selectedCampusHub ? selectedCampusHub.shortName : "校区"}
              </span>
            </button>

            {isLoggedIn && (
              <>
                <NotificationBell
                  notifications={notifications}
                  unreadCount={notifications.filter((n) => !n.read).length}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                />

                <button
                  onClick={() => navigateTo("cart")}
                  className="relative text-xs text-neutral-300 hover:text-white flex items-center gap-1 font-semibold transition px-2 py-1 rounded-full hover:bg-white/10"
                  title="购物车"
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
                    <span className="bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </button>
              </>
            )}

            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="hidden lg:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs text-neutral-300 border border-white/10 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-[11px] text-white font-bold">
                {currentUser?.roll || "2023012345"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 cursor-pointer border border-white/15 flex-shrink-0 whitespace-nowrap"
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
                className="text-xs bg-white text-neutral-950 hover:bg-neutral-200 px-4 py-1.5 rounded-full font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
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

            {/* Hamburger dropdown toggle */}
            <button
              onClick={() => setNavMenuOpen(!navMenuOpen)}
              className="text-neutral-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
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
        <div className="fixed inset-0 z-40 bg-neutral-950/80 backdrop-blur-md flex flex-col justify-center items-center gap-6 text-white text-2xl font-display font-bold animate-in fade-in duration-200">
          {!isLoggedIn && (
            <button
              onClick={() => {
                navigateTo("/");
                setNavMenuOpen(false);
              }}
              className="hover:text-neutral-400"
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
                className="hover:text-neutral-400"
                           >
                首页
              </button>
              <button
                onClick={() => {
                  navigateTo("/marketplace");
                  setNavMenuOpen(false);
                }}
                className="hover:text-neutral-400"
              >
                二手市场
              </button>
                <button
                onClick={() => {
                  navigateTo("/services");
                  setNavMenuOpen(false);
                }}
                className="hover:text-neutral-400"
                >
                跑腿互助
                </button>
                <button
                onClick={() => {
                  navigateTo("/courses");
                  setNavMenuOpen(false);
                }}
                className="hover:text-neutral-400"
                >
                专业书单
                </button>
                <button
                onClick={() => {
                  navigateTo("/cart");
                  setNavMenuOpen(false);
                }}
                className="hover:text-neutral-400"
                >
                购物车 ({cart.length})
                </button>
                <button
                onClick={() => {
                  navigateTo("/orders");
                  setNavMenuOpen(false);
                }}
                className="hover:text-neutral-400"
                >
                订单记录
                </button>
                <button
                onClick={() => {
                  handleLogout();
                  setNavMenuOpen(false);
                }}
                className="mt-4 px-6 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-base"
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
              className="mt-4 px-6 py-2 bg-white text-black rounded-full text-base"
            >
              学生登录
            </button>
          )}
          <button
            onClick={() => setNavMenuOpen(false)}
            className="text-sm font-sans text-neutral-400 mt-6 tracking-widest uppercase"
          >
            ✕ 关闭菜单
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1">
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
      </main>

      {/* =========================================================================
              CLEAN EDITORIAL FOOTER WITH FROSTED WATERMARK (Video Timestamp 00:13 - 00:18)
             ========================================================================= */}
      <footer className="bg-neutral-950 text-white relative overflow-hidden pt-20 pb-12 px-6 sm:px-12 border-t border-neutral-900">
        {/* 页脚大字水印：河大同享 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-10">
          <span className="font-display font-black text-[14vw] tracking-tighter uppercase whitespace-nowrap">
            河大同享
          </span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-neutral-800">
          <div className="md:col-span-2 space-y-4">
            <div className="font-display font-bold text-2xl tracking-wide flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              河大同享 · 校园交易与互助
            </div>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              服务河南大学金明、明伦校区。以教材和专业书交易为重点，支持二手物品、站内沟通、校园跑腿与书籍推荐。
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-neutral-400">
              <span className="px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900">
                河南大学校园
              </span>
              <span className="px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900">
                校内当面交接
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400 mb-4">
              商品分类
            </h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="hover:text-white"
                >
                  工程制图工具
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="hover:text-white"
                >
                  计算器
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="hover:text-white"
                >
                  实验手册与笔记
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="hover:text-white"
                >
                  宿舍生活用品
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("marketplace")}
                  className="hover:text-white"
                >
                  校园自行车
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400 mb-4">
              交易与安全
            </h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <a href="#" className="hover:text-white">
                  图书馆服务台
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  食堂见面区
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  宿舍楼值班台
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  信用评分
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  二维码核验
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 relative z-10 gap-4">
          <div>© 2026 河大同享 · 河南大学校园二手交易与互助平台</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-neutral-300">
              隐私政策
            </a>
            <a href="#" className="hover:text-neutral-300">
              学生行为规范
            </a>
            <a href="#" className="hover:text-neutral-300">
              校园安全热线
            </a>
          </div>
        </div>
      </footer>

      {/* =========================================================================
              MODAL: AUTH — Login & Register (Glassmorphic Apple Style)
             ========================================================================= */}
      {isLoginOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          <div className="relative w-full max-w-md">
            {/* Ambient glow orbs */}
            <div aria-hidden="true" style={{ position:"absolute",top:"-80px",left:"-60px",width:"280px",height:"280px",borderRadius:"50%",background:"radial-gradient(circle,rgba(120,80,255,0.28) 0%,transparent 70%)",filter:"blur(32px)",pointerEvents:"none",zIndex:0 }} />
            <div aria-hidden="true" style={{ position:"absolute",bottom:"-60px",right:"-40px",width:"220px",height:"220px",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,180,0.22) 0%,transparent 70%)",filter:"blur(28px)",pointerEvents:"none",zIndex:0 }} />

            {/* Glass card */}
            <div className="relative rounded-3xl overflow-hidden" style={{ background:"rgba(255,255,255,0.08)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.18)",boxShadow:"0 32px 64px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.2)",zIndex:1 }}>

              {/* Close */}
              <button onClick={() => { setIsLoginOpen(false); setAuthTab("login"); }} aria-label="关闭" className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition text-xl leading-none">×</button>

              {/* Header */}
              <div className="pt-10 pb-0 px-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  {authTab === "login" ? "欢迎回来" : "加入河大同享"}
                </h3>
                <p className="text-sm text-white/50 mb-6">
                  {authTab === "login" ? "使用河南大学校园邮箱登录" : "注册河大同享校园交易账号"}
                </p>
              </div>

              {/* Tabs */}
              <div className="px-8 mb-6">
                <div className="flex p-1 rounded-2xl gap-1" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)" }}>
                  {["login","register"].map((tab) => (
                    <button key={tab} onClick={() => setAuthTab(tab)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={authTab === tab
                        ? { background:"rgba(255,255,255,0.15)",color:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.15)" }
                        : { color:"rgba(255,255,255,0.45)",border:"1px solid transparent" }}>
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
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">{label}</label>
                        <input type={type} required value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                          className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                          style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                          onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(255,255,255,0.12)"; }}
                          onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}
                        />
                      </div>
                    ))}
                    <button type="submit" className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 mt-2 cursor-pointer"
                      style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.1) 100%)",border:"1px solid rgba(255,255,255,0.25)",boxShadow:"0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.25)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background="linear-gradient(135deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.16) 100%)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background="linear-gradient(135deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.1) 100%)"; }}>
                      登录 →
                    </button>
                  </form>
                  <p className="text-center text-xs text-white/35 mt-5">
                    还没有账号？{" "}<button onClick={() => setAuthTab("register")} className="text-white/75 font-semibold hover:text-white transition">立即注册</button>
                  </p>
                </div>
              )}

              {/* ── REGISTER ── */}
              {authTab === "register" && (
                <div className="px-8 pb-8 max-h-[62vh] overflow-y-auto" style={{ scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.15) transparent" }}>
                  <form onSubmit={handleRegister} className="space-y-4">

                    {/* Simple text/email fields */}
                    {[
                      { label:"姓名",    req:true,  type:"text",     val:regName,     set:setRegName,     ph:"例如：李明" },
                      { label:"学号",  req:true,  type:"text",     val:regRoll,     set:setRegRoll,     ph:"例如：2023012345" },
                    ].map(({ label, req, type, val, set, ph }) => (
                      <div key={label}>
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">{label} {req && <span className="text-red-400">*</span>}</label>
                        <input type={type} required={req} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                          className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                          style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                          onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(255,255,255,0.12)"; }}
                          onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}
                        />
                      </div>
                    ))}

                    {/* College Email with auto-fill */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">河南大学邮箱 <span className="text-red-400">*</span></label>
                      <input type="email" required value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); const p=e.target.value.split("@")[0]; if(p && !regRoll) setRegRoll(p.toUpperCase()); }}
                        placeholder="学号@henu.edu.cn"
                        className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                        style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                        onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(255,255,255,0.12)"; }}
                        onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}
                      />
                      <p className="text-[11px] text-white/35 mt-1.5 ml-1">请填写河南大学邮箱地址</p>
                    </div>

                    {/* 学院下拉（河南大学院系） */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">学院 <span className="text-red-400">*</span></label>
                      <select required value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl text-sm focus:outline-none transition appearance-none"
                        style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",color:regDepartment?"#fff":"rgba(255,255,255,0.3)" }}
                        onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(18,18,30,0.97)"; }}
                        onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}>
                        <option value="" style={{ background:"#12121e" }}>请选择学院…</option>
                        {["计算机与信息工程学院","软件学院","人工智能学院","数学与统计学院","物理与电子学院","化学化工学院","生命科学学院","材料学院","土木建筑学院","经济学院","商学院","法学院","文学院","历史文化学院","教育学部","新闻与传播学院","外国语学院","音乐学院","美术学院","体育学院","药学院","护理与健康学院","国际教育学院","其他"].map(d=>(
                          <option key={d} value={d} style={{ background:"#12121e" }}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campus */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">校区</label>
                      <input type="text" value={regCampus} onChange={(e) => setRegCampus(e.target.value)} placeholder="河南大学金明校区 / 明伦校区"
                        className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                        style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                        onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(255,255,255,0.12)"; }}
                        onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">密码 <span className="text-red-400">*</span></label>
                      <input type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="至少 6 位字符"
                        className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                        style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                        onFocus={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.35)"; e.target.style.background="rgba(255,255,255,0.12)"; }}
                        onBlur={(e) => { e.target.style.border="1px solid rgba(255,255,255,0.14)"; e.target.style.background="rgba(255,255,255,0.08)"; }}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">确认密码 <span className="text-red-400">*</span></label>
                      <input type="password" required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="再次输入密码"
                        className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                        style={{ background:"rgba(255,255,255,0.08)",border:regConfirmPassword&&regPassword!==regConfirmPassword?"1px solid rgba(248,113,113,0.6)":"1px solid rgba(255,255,255,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
                        onFocus={(e) => { e.target.style.background="rgba(255,255,255,0.12)"; }}
                        onBlur={(e) => { e.target.style.background="rgba(255,255,255,0.08)"; }}
                      />
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="text-[11px] text-red-400 mt-1.5 ml-1">两次输入的密码不一致</p>
                      )}
                    </div>

                    <button type="submit" disabled={regLoading}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50"
                      style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.1) 100%)",border:"1px solid rgba(255,255,255,0.25)",boxShadow:"0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                      {regLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                          正在创建账号…
                        </span>
                      ) : "创建账号 →"}
                    </button>
                  </form>
                  <p className="text-center text-xs text-white/35 mt-5">
                    已有账号？{" "}<button onClick={() => setAuthTab("login")} className="text-white/75 font-semibold hover:text-white transition">去登录</button>
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
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedSeller(null)}
              className="absolute top-6 right-6 text-neutral-400 text-2xl leading-none"
            >
              &times;
            </button>
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedSeller.avatar}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-neutral-900"
                alt=""
              />
              <div>
                <h4 className="font-display text-xl font-bold text-neutral-900">
                  {selectedSeller.name}
                </h4>
                <p className="text-xs text-neutral-500">
                  {selectedSeller.department}
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  已认证学生
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-700">
                  同学互信评分
                </span>
                <span className="font-black text-emerald-600 text-sm">
                  {selectedSeller.trustScore} / 100
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${selectedSeller.trustScore}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-neutral-400">
                基于举报记录、当面交接次数与同学评价综合计算。
              </p>
            </div>

            <button
              onClick={() => {
                startChat(selectedSeller, { title: "卖家咨询" });
                setSelectedSeller(null);
              }}
              className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition"
            >
              发送站内消息
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
              DRAWER: REAL-TIME BUYER-SELLER CHAT
             ========================================================================= */}
      {activeChat && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-neutral-200 flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center gap-3">
              <img
                src={activeChat.seller.avatar}
                className="w-9 h-9 rounded-full object-cover"
                alt=""
              />
              <div>
                <h4 className="font-bold text-sm text-neutral-900">
                  {activeChat.seller.name}
                </h4>
                <p className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                  关于：{activeChat.item.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveChat(null)}
              className="text-neutral-400 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs custom-scroll bg-neutral-100/50">
            <div className="text-center text-[10px] text-neutral-400 py-1">
              🔒 校内认证同学对话
            </div>
            {activeChat.messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${m.sender === "buyer" ? "bg-neutral-950 text-white rounded-br-xs" : "bg-white border border-neutral-200 text-neutral-800 rounded-bl-xs"}`}
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
            className="p-3 border-t border-neutral-200 bg-white flex gap-2"
          >
            <input
              name="chatMsg"
              type="text"
              placeholder="输入消息或出价..."
              className="flex-1 px-3 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-950 text-white font-bold rounded-xl text-xs hover:bg-neutral-800"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setQrModalItem(null)}
              className="absolute top-4 right-4 text-neutral-400 text-2xl leading-none"
            >
              &times;
            </button>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              安全交接凭证
            </span>
            <h3 className="font-display text-xl font-bold text-neutral-900">
              订单 #{qrModalItem.id}
            </h3>
            <p>
              请在{" "}
              <strong>
                {qrModalItem.pickupLocation || "校园服务台"}
              </strong>
              出示此二维码。
            </p>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HENUTONGXIANG-PICKUP-${qrModalItem.id}`}
                alt="取货二维码"
                className="w-36 h-36 mx-auto rounded-lg"
              />
            </div>

            <div className="text-[11px] font-mono text-neutral-400">
              凭证 #CP-{Math.floor(1000 + Math.random() * 9000)}
            </div>

            <button
              onClick={() => {
                confetti({ particleCount: 80, spread: 60 });
                setQrModalItem(null);
                showToast(
                  "🎉 二维码核验完成！买卖双方信用评分已提升。",
                );
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
            >
              模拟完成二维码核验
            </button>
          </div>
        </div>
      )}

      {/* 河南大学校区地图 */}
      <CampusMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectCampus={(college) => {
          setSelectedCampusHub(college);
          showToast(`📍 当前校区已设为：${college.name}`);
        }}
      />

      {/* CUTE INTERACTIVE DRAGGABLE CAMPUS BOT */}
      <CampusBot
        currentUser={currentUser}
        onNavigate={navigateTo}
        allProducts={allProducts}
      />

      {/* TOAST POPUP */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export default App;
