/*
 * Storefront — Thebes IDE flagship e-commerce template.
 * Vanilla JS, no build, no external imports.
 * Requires: window.EgyptBoundary (boundary.js loaded), window.BACKEND_CID set.
 *
 * Backend methods used:
 *   products()  → query, no args  → decodeVecRecord
 *   placeOrder(ids:[Nat], qtys:[Nat]) → update, encodeArgs two vec nat
 *   myOrders()  → shared query, no args → decodeVecRecord
 */
(function () {
  "use strict";

  // ── Styles ─────────────────────────────────────────────────────────────

  const STYLE = `
    :root {
      --bg: #f7f5f2;
      --surface: #ffffff;
      --surface-raised: #fdfcfb;
      --border: #e8e4de;
      --border-strong: #cec9c0;
      --text: #1c1917;
      --text-2: #57534e;
      --text-3: #a8a29e;
      --primary: #b45309;
      --primary-hover: #92400e;
      --primary-fg: #fffbeb;
      --primary-soft: #fef3c7;
      --success: #15803d;
      --success-bg: #f0fdf4;
      --success-border: #bbf7d0;
      --error: #dc2626;
      --error-bg: #fef2f2;
      --error-border: #fecaca;
      --badge-bg: #1c1917;
      --badge-fg: #ffffff;
      --r-sm: 8px;
      --r-md: 12px;
      --r-lg: 16px;
      --r-xl: 20px;
      --shadow-xs: 0 1px 2px rgba(0,0,0,.04);
      --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04);
      --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.05);
      --shadow-lg: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
      --transition: .18s cubic-bezier(.4,0,.2,1);
      --font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    }

    .sf-root *, .sf-root *::before, .sf-root *::after {
      box-sizing: border-box; margin: 0; padding: 0;
    }
    .sf-root {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* ── Header ── */
    .sf-header {
      position: sticky; top: 0; z-index: 200;
      background: rgba(247,245,242,.88);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      border-bottom: 1px solid var(--border);
    }
    .sf-header-inner {
      max-width: 1160px; margin: 0 auto;
      padding: 0 24px;
      height: 62px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .sf-logo {
      display: flex; align-items: center; gap: 10px;
    }
    .sf-logo-mark {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--text);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; line-height: 1; user-select: none;
    }
    .sf-logo-name {
      font-size: .9375rem; font-weight: 700; letter-spacing: -.02em; color: var(--text);
    }
    .sf-header-actions { display: flex; align-items: center; gap: 12px; }
    .sf-orders-btn {
      background: transparent; border: 1px solid var(--border);
      border-radius: var(--r-sm); padding: 6px 14px;
      font-family: var(--font); font-size: .8125rem; font-weight: 500;
      color: var(--text-2); cursor: pointer;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
      white-space: nowrap;
    }
    .sf-orders-btn:hover { background: var(--surface); border-color: var(--border-strong); color: var(--text); }
    .sf-cart-btn {
      position: relative; background: var(--text); color: #fff;
      border: none; border-radius: var(--r-sm); padding: 8px 16px;
      font-family: var(--font); font-size: .875rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: background var(--transition), transform var(--transition);
      white-space: nowrap;
    }
    .sf-cart-btn:hover { background: #292524; }
    .sf-cart-btn:active { transform: scale(.97); }
    .sf-cart-icon { font-size: 15px; }
    .sf-cart-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 999px; background: var(--primary); color: var(--primary-fg);
      font-size: .6875rem; font-weight: 700; line-height: 1;
      transition: transform var(--transition), opacity var(--transition);
    }
    .sf-cart-badge[data-zero="true"] { opacity: 0; transform: scale(.6); }

    /* ── Main ── */
    .sf-main {
      max-width: 1160px; margin: 0 auto;
      padding: 40px 24px 80px;
    }
    .sf-hero {
      margin-bottom: 36px;
    }
    .sf-hero h1 {
      font-size: 1.875rem; font-weight: 800; letter-spacing: -.035em; line-height: 1.15;
      color: var(--text);
    }
    .sf-hero p { margin-top: 8px; font-size: .9375rem; color: var(--text-2); line-height: 1.6; }
    .sf-chain-pill {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 14px; padding: 5px 12px;
      background: var(--primary-soft); border: 1px solid #fde68a;
      border-radius: 999px; font-size: .75rem; font-weight: 600;
      color: var(--primary);
    }
    .sf-chain-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); }

    /* ── Product grid ── */
    .sf-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
      gap: 20px;
    }
    .sf-product-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column;
      overflow: hidden;
      transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
      cursor: default;
    }
    .sf-product-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--border-strong);
    }
    .sf-product-tile {
      height: 160px;
      display: flex; align-items: center; justify-content: center;
      font-size: 3.5rem; user-select: none;
      background: linear-gradient(135deg, var(--bg) 0%, #ede9e3 100%);
      transition: background var(--transition);
    }
    .sf-product-card:hover .sf-product-tile {
      background: linear-gradient(135deg, #e9e4dc 0%, #ddd6cc 100%);
    }
    .sf-product-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .sf-product-name { font-size: .9375rem; font-weight: 700; color: var(--text); letter-spacing: -.01em; }
    .sf-product-desc { font-size: .8125rem; color: var(--text-2); line-height: 1.55; flex: 1; }
    .sf-product-footer {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      margin-top: 12px;
    }
    .sf-product-price { font-size: 1.0625rem; font-weight: 800; color: var(--text); letter-spacing: -.02em; }
    .sf-add-btn {
      background: var(--primary); color: var(--primary-fg);
      border: none; border-radius: var(--r-sm);
      padding: 7px 16px;
      font-family: var(--font); font-size: .8125rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      transition: background var(--transition), transform var(--transition);
      white-space: nowrap;
    }
    .sf-add-btn:hover { background: var(--primary-hover); }
    .sf-add-btn:active { transform: scale(.95); }
    .sf-add-btn.added {
      background: #d97706;
    }

    /* ── Loading skeleton ── */
    .sf-skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
      gap: 20px;
    }
    .sf-skeleton-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--r-xl); overflow: hidden;
    }
    .sf-skeleton-tile {
      height: 160px; background: linear-gradient(90deg, #ede9e3 25%, #e2ddd6 50%, #ede9e3 75%);
      background-size: 400% 100%; animation: sf-shimmer 1.4s ease-in-out infinite;
    }
    .sf-skeleton-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 10px; }
    .sf-skeleton-line {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg, #ede9e3 25%, #e2ddd6 50%, #ede9e3 75%);
      background-size: 400% 100%; animation: sf-shimmer 1.4s ease-in-out infinite;
    }
    .sf-skeleton-line.w75 { width: 75%; }
    .sf-skeleton-line.w55 { width: 55%; }
    .sf-skeleton-line.w90 { width: 90%; }
    @keyframes sf-shimmer { 0%,100%{background-position:100% 50%;} 50%{background-position:0% 50%;} }

    /* ── Error state ── */
    .sf-load-error {
      padding: 48px 0; text-align: center;
      color: var(--text-2); font-size: .9375rem;
    }
    .sf-load-error .icon { font-size: 2.5rem; margin-bottom: 12px; }
    .sf-load-error button {
      margin-top: 16px; background: var(--text); color: #fff;
      border: none; border-radius: var(--r-sm); padding: 9px 20px;
      font-family: var(--font); font-size: .875rem; font-weight: 600;
      cursor: pointer;
    }

    /* ── Cart drawer ── */
    .sf-cart-overlay {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(28,25,23,.45);
      backdrop-filter: blur(3px);
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease;
    }
    .sf-cart-overlay.open { opacity: 1; pointer-events: auto; }
    .sf-cart-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 301;
      width: min(440px, 100vw);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform .28s cubic-bezier(.32,.72,0,1);
    }
    .sf-cart-drawer.open { transform: translateX(0); }
    .sf-cart-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 18px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .sf-cart-title { font-size: 1.0625rem; font-weight: 700; letter-spacing: -.02em; }
    .sf-cart-close {
      width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px;
      background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--text-2); transition: background var(--transition), color var(--transition);
    }
    .sf-cart-close:hover { background: var(--bg); color: var(--text); }
    .sf-cart-body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
    .sf-cart-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 40px 0; text-align: center; color: var(--text-3);
    }
    .sf-cart-empty .icon { font-size: 3rem; margin-bottom: 12px; opacity: .7; }
    .sf-cart-empty p { font-size: .9rem; color: var(--text-3); }
    .sf-cart-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 14px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
    }
    .sf-cart-item-emoji {
      font-size: 1.75rem; width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg); border-radius: var(--r-sm);
      flex-shrink: 0;
    }
    .sf-cart-item-info { flex: 1; min-width: 0; }
    .sf-cart-item-name { font-size: .875rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sf-cart-item-price { font-size: .8125rem; color: var(--text-2); margin-top: 2px; }
    .sf-qty-control {
      display: flex; align-items: center; gap: 2px; flex-shrink: 0;
    }
    .sf-qty-btn {
      width: 28px; height: 28px; border: 1px solid var(--border); background: var(--surface);
      border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; color: var(--text-2);
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
      line-height: 1;
    }
    .sf-qty-btn:hover { background: var(--bg); border-color: var(--border-strong); color: var(--text); }
    .sf-qty-btn.minus:hover { background: #fef2f2; border-color: #fecaca; color: var(--error); }
    .sf-qty-val {
      min-width: 32px; text-align: center;
      font-size: .875rem; font-weight: 700; color: var(--text);
    }
    .sf-cart-item-remove {
      width: 28px; height: 28px; background: transparent; border: none;
      border-radius: 6px; cursor: pointer; color: var(--text-3);
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition), color var(--transition);
      flex-shrink: 0;
    }
    .sf-cart-item-remove:hover { background: #fef2f2; color: var(--error); }
    .sf-cart-foot {
      padding: 16px 24px 24px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
      display: flex; flex-direction: column; gap: 14px;
    }
    .sf-subtotal-row {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: .875rem; color: var(--text-2);
    }
    .sf-subtotal-row strong { font-size: 1.125rem; font-weight: 800; color: var(--text); }
    .sf-checkout-btn {
      width: 100%; padding: 13px 0;
      background: var(--primary); color: var(--primary-fg);
      border: none; border-radius: var(--r-md);
      font-family: var(--font); font-size: .9375rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background var(--transition), transform var(--transition), opacity var(--transition);
      letter-spacing: -.01em;
    }
    .sf-checkout-btn:hover:not(:disabled) { background: var(--primary-hover); }
    .sf-checkout-btn:active:not(:disabled) { transform: scale(.98); }
    .sf-checkout-btn:disabled { opacity: .55; cursor: not-allowed; }
    .sf-cart-notice {
      padding: 10px 14px; border-radius: var(--r-sm);
      font-size: .8125rem; line-height: 1.5;
    }
    .sf-cart-notice.error { background: var(--error-bg); border: 1px solid var(--error-border); color: var(--error); }

    /* ── Spinner ── */
    @keyframes sf-spin { to { transform: rotate(360deg); } }
    .sf-spinner {
      display: inline-block; width: 16px; height: 16px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff;
      animation: sf-spin .6s linear infinite; flex-shrink: 0;
    }
    .sf-spinner.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--text); }

    /* ── Success overlay ── */
    .sf-success-sheet {
      position: fixed; inset: 0; z-index: 400;
      background: var(--surface);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 32px;
      opacity: 0; pointer-events: none;
      transition: opacity .3s ease;
    }
    .sf-success-sheet.visible { opacity: 1; pointer-events: auto; }
    .sf-success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--success-bg); border: 2px solid var(--success-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin-bottom: 20px;
    }
    .sf-success-sheet h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: -.03em; margin-bottom: 8px; }
    .sf-success-sheet p { font-size: .9375rem; color: var(--text-2); max-width: 340px; line-height: 1.6; }
    .sf-success-meta {
      margin: 16px 0 0;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .sf-success-tag {
      background: var(--success-bg); border: 1px solid var(--success-border);
      border-radius: 999px; padding: 4px 14px;
      font-size: .8125rem; font-weight: 600; color: var(--success);
    }
    .sf-success-keep {
      margin-top: 28px; padding: 11px 28px;
      background: var(--text); color: #fff;
      border: none; border-radius: var(--r-md);
      font-family: var(--font); font-size: .9375rem; font-weight: 700;
      cursor: pointer;
      transition: background var(--transition);
    }
    .sf-success-keep:hover { background: #292524; }

    /* ── Orders panel ── */
    .sf-orders-overlay {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(28,25,23,.45);
      backdrop-filter: blur(3px);
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease;
    }
    .sf-orders-overlay.open { opacity: 1; pointer-events: auto; }
    .sf-orders-drawer {
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 301;
      width: min(400px, 100vw);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column;
      transform: translateX(-100%);
      transition: transform .28s cubic-bezier(.32,.72,0,1);
    }
    .sf-orders-drawer.open { transform: translateX(0); }
    .sf-orders-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .sf-orders-title { font-size: 1.0625rem; font-weight: 700; letter-spacing: -.02em; }
    .sf-orders-body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }
    .sf-order-card {
      padding: 14px 16px;
      background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--r-md);
    }
    .sf-order-id { font-size: .75rem; font-weight: 600; color: var(--text-3); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
    .sf-order-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
    .sf-order-total { font-size: 1rem; font-weight: 800; color: var(--text); }
    .sf-order-items { font-size: .8125rem; color: var(--text-2); }
    .sf-orders-empty { padding: 40px 0; text-align: center; color: var(--text-3); font-size: .9rem; }
    .sf-orders-loading { padding: 40px 0; text-align: center; }

    @media (max-width: 640px) {
      .sf-main { padding: 24px 16px 64px; }
      .sf-hero h1 { font-size: 1.5rem; }
      .sf-hero p { font-size: .875rem; }
      .sf-header-inner { padding: 0 16px; }
      .sf-logo-name { display: none; }
    }
  `;

  // ── Helpers ────────────────────────────────────────────────────────────

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  function fmtPrice(cents) {
    const c = Number(typeof cents === "bigint" ? cents : BigInt(cents));
    return "$" + (c / 100).toFixed(2);
  }

  // ── Cart state ─────────────────────────────────────────────────────────
  // cart: Map<productId (number), {product, qty}>
  let cartMap = new Map();

  function cartTotal() {
    let t = 0;
    for (const { product, qty } of cartMap.values()) {
      t += Number(product.price) * qty;
    }
    return t;
  }

  function cartItemCount() {
    let c = 0;
    for (const { qty } of cartMap.values()) c += qty;
    return c;
  }

  // ── Main mount ─────────────────────────────────────────────────────────

  window.AppDomain = {
    mount: function (rootEl) {

      // Inject styles once
      if (!document.getElementById("sf-style")) {
        const s = document.createElement("style");
        s.id = "sf-style"; s.textContent = STYLE;
        document.head.appendChild(s);
      }

      const B = window.EgyptBoundary;
      const CID = window.BACKEND_CID;

      rootEl.className = "sf-root";
      rootEl.innerHTML = `
        <!-- Header -->
        <header class="sf-header">
          <div class="sf-header-inner">
            <div class="sf-logo">
              <span class="sf-logo-mark">🏺</span>
              <span class="sf-logo-name">Memphis Store</span>
            </div>
            <div class="sf-header-actions">
              <button class="sf-orders-btn" id="sf-orders-open">My Orders</button>
              <button class="sf-cart-btn" id="sf-cart-open">
                <span class="sf-cart-icon">🛒</span>
                Cart
                <span class="sf-cart-badge" id="sf-cart-count" data-zero="true">0</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main content -->
        <main class="sf-main">
          <div class="sf-hero">
            <h1>Curated Essentials</h1>
            <p>Beautifully made objects for everyday life — all orders recorded on-chain.</p>
            <span class="sf-chain-pill">
              <span class="sf-chain-dot"></span>
              Egypt L1 · on-chain orders
            </span>
          </div>
          <div id="sf-product-area">
            ${skeletonGrid()}
          </div>
        </main>

        <!-- Cart drawer -->
        <div class="sf-cart-overlay" id="sf-cart-overlay"></div>
        <aside class="sf-cart-drawer" id="sf-cart-drawer" aria-label="Shopping cart">
          <div class="sf-cart-head">
            <span class="sf-cart-title">Your Cart</span>
            <button class="sf-cart-close" id="sf-cart-close" aria-label="Close cart">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="sf-cart-body" id="sf-cart-body"></div>
          <div class="sf-cart-foot" id="sf-cart-foot" style="display:none">
            <div class="sf-subtotal-row">
              <span>Subtotal</span>
              <strong id="sf-subtotal">$0.00</strong>
            </div>
            <div id="sf-cart-notice" style="display:none"></div>
            <button class="sf-checkout-btn" id="sf-checkout-btn">
              <span id="sf-checkout-label">Place Order On-Chain</span>
            </button>
          </div>
        </aside>

        <!-- Orders drawer -->
        <div class="sf-orders-overlay" id="sf-orders-overlay"></div>
        <aside class="sf-orders-drawer" id="sf-orders-drawer" aria-label="My orders">
          <div class="sf-orders-head">
            <span class="sf-orders-title">My Orders</span>
            <button class="sf-cart-close" id="sf-orders-close" aria-label="Close orders">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="sf-orders-body" id="sf-orders-body">
            <div class="sf-orders-empty">Open your orders to see on-chain history.</div>
          </div>
        </aside>

        <!-- Success overlay -->
        <div class="sf-success-sheet" id="sf-success">
          <div class="sf-success-icon">✅</div>
          <h2>Order placed!</h2>
          <p>Your order has been recorded on Egypt L1. It will be there forever.</p>
          <div class="sf-success-meta">
            <span class="sf-success-tag" id="sf-success-detail">Order #0 · $0.00</span>
          </div>
          <button class="sf-success-keep" id="sf-success-keep">Keep Shopping</button>
        </div>
      `;

      // ── Element refs ──
      const $area      = rootEl.querySelector("#sf-product-area");
      const $badge     = rootEl.querySelector("#sf-cart-count");
      const $cartBody  = rootEl.querySelector("#sf-cart-body");
      const $cartFoot  = rootEl.querySelector("#sf-cart-foot");
      const $subtotal  = rootEl.querySelector("#sf-subtotal");
      const $cartNotice = rootEl.querySelector("#sf-cart-notice");
      const $checkout  = rootEl.querySelector("#sf-checkout-btn");
      const $checkoutLbl = rootEl.querySelector("#sf-checkout-label");
      const $ordersBody = rootEl.querySelector("#sf-orders-body");
      const $success   = rootEl.querySelector("#sf-success");
      const $successDetail = rootEl.querySelector("#sf-success-detail");

      // product data cache
      let products = [];

      // ── Skeleton ──
      function skeletonGrid() {
        return `<div class="sf-skeleton-grid">${[0,1,2,3,4,5].map(() => `
          <div class="sf-skeleton-card">
            <div class="sf-skeleton-tile"></div>
            <div class="sf-skeleton-body">
              <div class="sf-skeleton-line w75"></div>
              <div class="sf-skeleton-line w90"></div>
              <div class="sf-skeleton-line w55"></div>
            </div>
          </div>`).join("")}</div>`;
      }

      // ── Load products ──
      async function loadProducts() {
        try {
          const r = await B.callQuery(CID, "products", B.EMPTY_ARGS_HEX);
          if (!r || !r.reply) throw new Error("no reply");
          products = B.decodeVecRecord(r.reply, [
            { name: "id",    type: "nat"  },
            { name: "name",  type: "text" },
            { name: "price", type: "nat"  },
            { name: "emoji", type: "text" },
            { name: "desc",  type: "text" },
          ]);
          renderGrid();
        } catch (err) {
          $area.innerHTML = `
            <div class="sf-load-error">
              <div class="icon">⚠️</div>
              <div>Could not load products.</div>
              <button onclick="window._sfReload && window._sfReload()">Retry</button>
            </div>`;
          window._sfReload = loadProducts;
          console.error("products error", err);
        }
      }

      // ── Render grid ──
      function renderGrid() {
        if (!products.length) {
          $area.innerHTML = `<div class="sf-load-error"><div class="icon">🏪</div><div>No products available.</div></div>`;
          return;
        }
        $area.innerHTML = `<div class="sf-grid">${products.map(p => productCard(p)).join("")}</div>`;
        // Bind add-to-cart buttons
        $area.querySelectorAll("[data-add]").forEach(btn => {
          btn.addEventListener("click", function () {
            const id = Number(this.dataset.add);
            const prod = products.find(p => Number(p.id) === id);
            if (!prod) return;
            addToCart(prod, this);
          });
        });
      }

      function productCard(p) {
        const id = Number(p.id);
        return `
          <div class="sf-product-card">
            <div class="sf-product-tile">${esc(p.emoji)}</div>
            <div class="sf-product-body">
              <div class="sf-product-name">${esc(p.name)}</div>
              <div class="sf-product-desc">${esc(p.desc)}</div>
              <div class="sf-product-footer">
                <span class="sf-product-price">${fmtPrice(p.price)}</span>
                <button class="sf-add-btn" data-add="${id}">
                  Add to cart
                </button>
              </div>
            </div>
          </div>`;
      }

      // ── Cart logic ──
      function addToCart(prod, btn) {
        const id = Number(prod.id);
        if (cartMap.has(id)) {
          cartMap.get(id).qty += 1;
        } else {
          cartMap.set(id, { product: prod, qty: 1 });
        }
        updateCartBadge();
        // Pulse button
        btn.textContent = "✓ Added";
        btn.classList.add("added");
        setTimeout(() => { btn.textContent = "Add to cart"; btn.classList.remove("added"); }, 900);
      }

      function updateCartBadge() {
        const n = cartItemCount();
        $badge.textContent = String(n);
        $badge.dataset.zero = String(n === 0);
      }

      function renderCartBody() {
        const items = [...cartMap.values()];
        if (!items.length) {
          $cartBody.innerHTML = `
            <div class="sf-cart-empty">
              <div class="icon">🛒</div>
              <p>Your cart is empty.<br>Add some items to get started.</p>
            </div>`;
          $cartFoot.style.display = "none";
          return;
        }
        $cartBody.innerHTML = items.map(({ product: p, qty }) => {
          const id = Number(p.id);
          return `
            <div class="sf-cart-item" data-cart-id="${id}">
              <span class="sf-cart-item-emoji">${esc(p.emoji)}</span>
              <div class="sf-cart-item-info">
                <div class="sf-cart-item-name">${esc(p.name)}</div>
                <div class="sf-cart-item-price">${fmtPrice(p.price)} each</div>
              </div>
              <div class="sf-qty-control">
                <button class="sf-qty-btn minus" data-cart-dec="${id}" aria-label="Decrease">−</button>
                <span class="sf-qty-val">${qty}</span>
                <button class="sf-qty-btn" data-cart-inc="${id}" aria-label="Increase">+</button>
              </div>
              <button class="sf-cart-item-remove" data-cart-rm="${id}" aria-label="Remove">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 1L12 12M12 1L1 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>`;
        }).join("");

        // Bind controls
        $cartBody.querySelectorAll("[data-cart-inc]").forEach(btn => {
          btn.addEventListener("click", () => { changeQty(Number(btn.dataset.cartInc), 1); });
        });
        $cartBody.querySelectorAll("[data-cart-dec]").forEach(btn => {
          btn.addEventListener("click", () => { changeQty(Number(btn.dataset.cartDec), -1); });
        });
        $cartBody.querySelectorAll("[data-cart-rm]").forEach(btn => {
          btn.addEventListener("click", () => { cartMap.delete(Number(btn.dataset.cartRm)); updateCartBadge(); renderCartBody(); });
        });

        $subtotal.textContent = fmtPrice(cartTotal());
        $cartFoot.style.display = "";
        $cartNotice.style.display = "none";
      }

      function changeQty(id, delta) {
        if (!cartMap.has(id)) return;
        const entry = cartMap.get(id);
        const newQty = entry.qty + delta;
        if (newQty <= 0) {
          cartMap.delete(id);
        } else {
          entry.qty = newQty;
        }
        updateCartBadge();
        renderCartBody();
      }

      // ── Cart drawer open/close ──
      function openCart() {
        renderCartBody();
        rootEl.querySelector("#sf-cart-overlay").classList.add("open");
        rootEl.querySelector("#sf-cart-drawer").classList.add("open");
        document.body.style.overflow = "hidden";
      }

      function closeCart() {
        rootEl.querySelector("#sf-cart-overlay").classList.remove("open");
        rootEl.querySelector("#sf-cart-drawer").classList.remove("open");
        document.body.style.overflow = "";
      }

      // ── Orders drawer open/close ──
      function openOrders() {
        rootEl.querySelector("#sf-orders-overlay").classList.add("open");
        rootEl.querySelector("#sf-orders-drawer").classList.add("open");
        document.body.style.overflow = "hidden";
        loadMyOrders();
      }

      function closeOrders() {
        rootEl.querySelector("#sf-orders-overlay").classList.remove("open");
        rootEl.querySelector("#sf-orders-drawer").classList.remove("open");
        document.body.style.overflow = "";
      }

      // ── Load my orders ──
      async function loadMyOrders() {
        $ordersBody.innerHTML = `
          <div class="sf-orders-loading">
            <span class="sf-spinner dark"></span>
          </div>`;
        try {
          // myOrders is a shared query — use the query path with the browser's
          // persisted identity (boundary.js sends the same sender for callUpdate,
          // so placeOrder and myOrders agree on the caller).
          const r = await B.callQuery(CID, "myOrders", B.EMPTY_ARGS_HEX);
          if (!r || r.error || !r.reply) throw new Error(r && r.error || "no reply");
          const orrs = B.decodeVecRecord(r.reply, [
            { name: "id",        type: "nat" },
            { name: "total",     type: "nat" },
            { name: "itemCount", type: "nat" },
          ]);
          if (!orrs.length) {
            $ordersBody.innerHTML = `<div class="sf-orders-empty">No orders yet — place your first one!</div>`;
          } else {
            $ordersBody.innerHTML = orrs.map(o => `
              <div class="sf-order-card">
                <div class="sf-order-id">Order #${esc(Number(o.id))}</div>
                <div class="sf-order-row">
                  <span class="sf-order-total">${fmtPrice(o.total)}</span>
                  <span class="sf-order-items">${esc(Number(o.itemCount))} item${Number(o.itemCount) !== 1 ? "s" : ""}</span>
                </div>
              </div>`).join("");
          }
        } catch (err) {
          $ordersBody.innerHTML = `<div class="sf-orders-empty" style="color:var(--error)">Failed to load orders.<br><small>${esc(String(err))}</small></div>`;
          console.error("myOrders error", err);
        }
      }

      // ── Checkout ──
      async function doCheckout() {
        if (!cartMap.size) return;
        $checkout.disabled = true;
        $checkoutLbl.innerHTML = `<span class="sf-spinner"></span> Submitting…`;
        $cartNotice.style.display = "none";

        // Build parallel arrays for placeOrder(ids: [Nat], qtys: [Nat])
        const ids  = [];
        const qtys = [];
        for (const [id, { qty }] of cartMap.entries()) {
          ids.push(id);
          qtys.push(qty);
        }

        // Encode: two vec nat args
        const argBytes = B.encodeArgs([
          { type: "vec", inner: { type: "nat" }, value: ids.map(n => BigInt(n))  },
          { type: "vec", inner: { type: "nat" }, value: qtys.map(n => BigInt(n)) },
        ]);
        const argHex = B.bytesToHex(argBytes);

        try {
          const r = await B.callUpdate(CID, "placeOrder", argHex, {});
          if (!r || r.status !== "success") {
            throw new Error((r && r.error) || "Unknown error");
          }
          const orderId = r.reply ? Number(B.decodeNatReply(r.reply)) : "?";
          const total   = fmtPrice(cartTotal());

          // Show success overlay
          $successDetail.textContent = "Order #" + orderId + " · " + total;
          $success.classList.add("visible");
          closeCart();

          // Clear cart
          cartMap.clear();
          updateCartBadge();

        } catch (err) {
          $cartNotice.className = "sf-cart-notice error";
          $cartNotice.textContent = "Checkout failed: " + String(err);
          $cartNotice.style.display = "";
          console.error("placeOrder error", err);
        } finally {
          $checkout.disabled = false;
          $checkoutLbl.textContent = "Place Order On-Chain";
        }
      }

      // ── Wire up events ──
      rootEl.querySelector("#sf-cart-open").addEventListener("click", openCart);
      rootEl.querySelector("#sf-cart-close").addEventListener("click", closeCart);
      rootEl.querySelector("#sf-cart-overlay").addEventListener("click", closeCart);
      rootEl.querySelector("#sf-orders-open").addEventListener("click", openOrders);
      rootEl.querySelector("#sf-orders-close").addEventListener("click", closeOrders);
      rootEl.querySelector("#sf-orders-overlay").addEventListener("click", closeOrders);
      rootEl.querySelector("#sf-checkout-btn").addEventListener("click", doCheckout);
      rootEl.querySelector("#sf-success-keep").addEventListener("click", () => {
        $success.classList.remove("visible");
      });

      // ── Keyboard dismiss ──
      document.addEventListener("keydown", function handler(e) {
        if (e.key === "Escape") {
          closeCart();
          closeOrders();
          $success.classList.remove("visible");
        }
      });

      // ── Bootstrap ──
      loadProducts();
    }
  };
})();
