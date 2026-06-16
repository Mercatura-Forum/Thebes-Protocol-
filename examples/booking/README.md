# booking (reservations)

A reservations app served from the chain: an operator publishes **listings** (a
boat, a car, a studio, an appointment) and generates time **slots**; visitors
book a slot. Bookings are keyed to the visitor and finalized by the validator
quorum.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/booking-api.ts`. Listing photos live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **No double-booking, atomically.** `bookAppointmentOrTrap` checks the slot is
   free and claims it in the *same* synchronous call, so two visitors can't both
   take the same slot. A booked/again request traps `"Slot already booked"`.
2. **Owner-gated listings.** The first caller claims the business; only the
   owner/admins add listings, generate slots, or set photos.

## Interface (headline methods)

Every mutation has a `Result`-returning form and an `*OrTrap` twin; the frontend
calls `*OrTrap` so a rejected guard surfaces as a failed call.

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `servicesView` | query | — | `vec record {id;name;durationMinutes;priceCents;photoPath}` | listings |
| `availableSlotsView` | query | `serviceId` | `vec record {id;serviceId;startNs}` | free slots |
| `myBookingsView` | query | — | `vec record {id;serviceId;serviceName;slotStart}` | caller's bookings |
| `addServiceOrTrap` | update | `name, durationMinutes, priceCents, photoPath:?text` | `nat` (id) | owner/admin |
| `createSlotsOrTrap` | update | `serviceId, startNs, endNs, intervalMinutes` | `nat` (count) | owner/admin |
| `bookAppointmentOrTrap` | update | `slotId` | `nat` (booking id) | atomic no-double-book; traps reason |
| `setServicePhotoOrTrap` | update | `serviceId, photoPath` | — | owner/admin |
| `seedDemo` | update | — | `bool` | seed demo listings + slots on an empty contract |

## Connect to the API

```sh
thebes-deploy query booking servicesView
thebes-deploy query booking availableSlotsView  --arg '(0:nat)'
thebes-deploy call  booking bookAppointmentOrTrap --arg '(0:nat)'   # → (0 : nat)
```

```js
const cid = window.BOOKING_CID, api = window.EgyptBoundary
const listings = await api.query(cid, 'servicesView', '()')
const bookingId = await api.call(cid, 'bookAppointmentOrTrap', '(0:nat)')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** The Browse empty state's **Load demo data** button calls
> `seedDemo` (three listings + future slots) so the app is immediately bookable.
