# chat (social room)

A real-time room with user profiles and on-chain avatars, served from the chain.
Messages are an append-only, trimmed log; the member roster is a B-tree of
profiles. Optionally, posts can be **Memphis-authenticated** — attributed to a
user's stable per-app identity rather than the transport sender.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`,
  `lib/MemphisAuth`, `lib/Users`, `lib/Pagination`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/chat-api.ts`. Avatar bytes live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **Append-only, bounded log.** Each post appends; the log is trimmed to a fixed
   maximum so storage can't grow without bound. No edit, no delete.
2. **Memphis-authenticated posting.** `postAs` verifies a Memphis session token
   (an inter-contract call to the Memphis identity contract) and attributes the
   message to the user's stable per-app principal.
3. **Register-before-avatar.** `setMyAvatarOrTrap` requires the caller to have
   registered a display name first, and returns a clear error otherwise.

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `register` | update | `displayName` | `Profile` | create/update the caller's profile |
| `setMyAvatarOrTrap` | update | `path` | — | store the caller's media-contract avatar path; traps if unregistered |
| `rosterView` | query | `offset, limit` | `vec record {principal;displayName;avatarPath;createdAt}` | paginated members |
| `myProfileView` | query | — | `vec record {displayName;avatarPath;createdAt}` | 0-or-1 element (empty = unregistered) |
| `post` | update | `text` | — | post as the transport caller |
| `postAs` | update | `token:blob, text` | `Result<(),text>` | Memphis-authenticated post |
| `recent` | query | `n` | `vec record {text;sender;timestamp}` | last `n` messages |
| `seedDemo` | update | — | `bool` | seed demo members + messages on an empty room |

## Connect to the API

```sh
thebes-deploy call  chat register   --arg '("Layla")'
thebes-deploy call  chat post        --arg '("gm")'
thebes-deploy query chat recent      --arg '(50:nat)'
thebes-deploy query chat rosterView  --arg '(0:nat, 200:nat)'
```

```js
const cid = window.CHAT_CID, api = window.EgyptBoundary
await api.call(cid, 'post', '("gm")')
const feed = await api.query(cid, 'recent', '(50:nat)')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Memphis sign-in.** The frontend signs in with a passkey (Memphis) as its web
> auth — the human identity + display name come from Memphis; the on-chain caller
> stays the boundary's persisted browser key. **Load demo data** in the empty room
> calls `seedDemo`.
