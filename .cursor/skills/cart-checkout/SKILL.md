---
name: cart-checkout
description: Implements Zustand shopping cart with LocalStorage persistence, quantity controls, and database sync on login for BARBARA E-Commerce. Use when building cart UI, add-to-cart flows, quantity selectors, or cart-to-checkout synchronization.
disable-model-invocation: true
---

# Cart & Checkout State

## Workflow

```
Task Progress:
- [ ] Buat src/stores/useCartStore.ts (Zustand + persist)
- [ ] Buat QuantitySelector component
- [ ] Wire add-to-cart dari product detail (respect maxStock)
- [ ] POST /api/cart/sync saat user login (merge LocalStorage → DB)
- [ ] Validasi stok di backend sebelum checkout
- [ ] clearCart() hanya setelah order Midtrans terinisiasi (PENDING/PAID)
```

## Zustand Store

- Key LocalStorage: `barbara-cart-storage`
- CartItem fields: `variantId`, `productId`, `name`, `size`, `color`, `price`, `imageUrl`, `quantity`, `maxStock`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getCartTotal`, `getCartCount`
- Quantity capped at `maxStock`; merge duplicate variantId on add

## Sync Rules

| Event | Action |
|-------|--------|
| User login | Sync items → `POST /api/cart/sync` |
| Checkout submit | Re-validate stock server-side |
| Payment initiated | `clearCart()` if order status PENDING or PAID |
| Payment failed/expired | Keep cart or restore from order logic |

## UI Pattern

QuantitySelector: bordered black box, `-` / `+` buttons, disable at min 1 and max stock.

## Code Templates

Store dan QuantitySelector: [reference.md](reference.md)
