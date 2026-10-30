# 🛒 FreshMart - Simple Grocery Mart Website (India / INR)

A clean, responsive, feature-rich grocery mart website built strictly using **HTML5, CSS3, and JavaScript**. Zero build steps, zero complex dependencies—it runs instantly right out of the box!

---

## 🌟 Features

- **🍎 24+ Curated Grocery Items**: Across 7 categories (Fresh Fruits, Farm Vegetables, Dairy, Paneer & Eggs, Bakery, Pantry Staples, Cold Beverages, Healthy Snacks) with realistic Indian Rupee (`₹`) pricing, discounts, units, ratings, and nutritional values.
- **⚡ Live Search & Filtering**: Instant search across titles, categories, and descriptions with quick clear button.
- **🏷️ Smart Category & Attribute Filters**: Filter by aisle, "Organic Only", or "On Sale / Discounted".
- **📊 Dynamic Sorting**: Sort items by Featured Picks, Price (Low to High / High to Low), Customer Rating, or Alphabetical (A-Z).
- **🛒 Interactive Shopping Cart Drawer**:
  - Live quantity adjustment (`+` and `-`) right from product cards or the cart drawer.
  - Interactive **Free Delivery Progress Bar** (unlocks free delivery when spending **₹499** or more).
  - Working **Coupon / Promo Code System**:
    - `FRESH20`: 20% discount on orders over ₹499.
    - `FREESHIP`: Free express delivery on any order.
    - `SAVE100`: ₹100 flat discount on orders over ₹599.
  - Itemized bill breakdown (Subtotal, Delivery Fee ₹40, Discount, Grand Total).
- **💳 Complete Checkout Modal**:
  - Customer contact details & delivery address input.
  - Delivery time slot picker (⚡ Express 20-30 min, ☀️ Morning 8-10 AM, 🌙 Evening 6-8 PM).
  - Indian payment method choices (UPI / GPay / PhonePe, Cash on Delivery, Card).
  - Celebration confetti animation upon placing an order.
  - Simulated real-time delivery status tracker (Order Confirmed → Packing Fresh Items → Out for Delivery).
- **❤️ Wishlist & Saved Items**: One-click heart toggle to save favorite items and quickly move them into the cart.
- **🕒 Order History**: Automatically persists previous orders in browser `localStorage`.
- **🔍 Product Quick View Modal**: Inspect nutritional highlights (calories, protein, carbs, vitamins) and descriptions in detail.
- **📍 Delivery Location Switcher**: Easily customize your delivery address and pincode.
- **🔔 Toast Notification System**: Real-time feedback for adds, removals, wishlist saves, and coupon redemptions.

---

## 📁 Project Structure

```text
ide/
├── index.html           # Main semantic HTML5 webpage & modals (INR styled)
├── css/
│   └── styles.css       # Custom animations, transitions, and scrollbars
├── js/
│   ├── products.js      # Comprehensive grocery catalog & INR promo codes
│   └── app.js           # State management, cart, checkout, search & UI logic
└── README.md            # Project documentation & instructions
```

---

## 🚀 How to Run

Because this website is built **strictly with standard HTML, CSS, and JavaScript**, there are no installations required!

### Option 1: Double-Click (Direct in Browser)
1. Navigate to the project directory in your file explorer.
2. Double-click [**`index.html`**](file:///c:/Users/pooja/OneDrive/Desktop/ide/index.html) to open it directly in Chrome, Edge, Firefox, or Safari.

### Option 2: Run with Python's Built-in Server
Open your terminal in the project directory and run:
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 🛠️ Built With
- **HTML5**: Semantic tags, accessible modal structures, and responsive layouts.
- **CSS3 & Tailwind (CDN)**: Modern utility styling, custom animations, and card hover effects.
- **Vanilla JavaScript**: State management, `localStorage` persistence, reactive DOM updates, Indian currency formatting (`₹`), and custom interactive components.
