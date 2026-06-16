# university (course registration)

A course-registration app served from the chain: a registrar publishes courses
and opens/closes the registration window; students enroll while it's open. Seat
capacity is enforced atomically — the registration analogue of no-double-booking.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/university-api.ts`. Course images live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **Seat capacity, atomically.** `enroll` checks a seat is free and increments
   the count in the *same* synchronous call, so two students can't both take the
   last seat.
2. **No double-enroll.** A student already in a course can't enroll again.
3. **Registration window.** `enroll`/`drop` only succeed while the registrar has
   the window open.

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `coursesView` | query | — | `vec record {id;code;title;capacity;enrolled;seatsLeft;instructor;photoPath}` | the catalog |
| `myCoursesView` | shared query | — | `vec record {id;code;title;instructor;photoPath}` | caller's enrollments |
| `isRegistrationOpen` | query | — | `bool` | window state |
| `addCourse` | update | `code, title, capacity, instructor, photoPath:?text` | `nat` (id) | registrar (admin); traps on zero capacity |
| `setRegistrationOpen` | update | `open:bool` | — | registrar (admin) |
| `enroll` | update | `courseId` | — | atomic seat take; traps full / closed / already-enrolled |
| `drop` | update | `courseId` | — | frees a seat while the window is open |
| `seedDemo` | update | — | `bool` | seed a demo catalog on an empty registrar |

## Connect to the API

```sh
thebes-deploy query university coursesView
thebes-deploy call  university enroll  --arg '(0:nat)'
thebes-deploy query university myCoursesView
```

```js
const cid = window.UNIVERSITY_CID, api = window.EgyptBoundary
const courses = await api.query(cid, 'coursesView', '()')
await api.call(cid, 'enroll', '(0:nat)')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** The Catalog empty state's **Load demo data** button calls
> `seedDemo` (five courses) so registration is immediately live.
