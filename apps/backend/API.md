# Meeting Room Booking – Backend API

Base URL: `http://localhost:3000` (or your deployed URL).

**Authentication:** Send the current user's ID in the header on every request:

- `X-User-Id: <user-uuid>`

No password. Frontend lets user "select" or "log in as" a user; that user's `id` is sent as `X-User-Id`.

---

## First-time setup

Create the first admin user (run once when there are no users):

```http
POST /users/seed
```

No body, no headers. Returns the created admin user (save the `id` for `X-User-Id`).

---

## Users (Admin only, except seed)

| Method | Path            | Description                                                                   |
| ------ | --------------- | ----------------------------------------------------------------------------- |
| POST   | /users/seed     | Create default admin (only when no users exist)                               |
| POST   | /users          | Create user. Body: `{ "name": string, "role": "admin" \| "owner" \| "user" }` |
| GET    | /users          | List all users                                                                |
| PATCH  | /users/:id/role | Change role. Body: `{ "role": "admin" \| "owner" \| "user" }`                 |
| DELETE | /users/:id      | Delete user (and all their bookings)                                          |

---

## Bookings

| Method | Path                      | Who                              | Description                                                              |
| ------ | ------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| POST   | /bookings                 | All                              | Create booking. Body: `{ "startTime": "ISO8601", "endTime": "ISO8601" }` |
| GET    | /bookings                 | All                              | List all bookings                                                        |
| GET    | /bookings/grouped-by-user | Owner, Admin                     | Bookings grouped by userId                                               |
| GET    | /bookings/summary         | Owner, Admin                     | Total count + count per user                                             |
| DELETE | /bookings/:id             | Owner/Admin: any; User: own only | Delete booking                                                           |

---

## Time handling

- All times are **ISO 8601** strings (e.g. `2025-02-24T09:00:00.000Z`).
- **Overlap rule:** Two bookings overlap if `start1 < end2 && end1 > start2`. Back-to-back (e.g. 10:00–11:00 and 11:00–12:00) do **not** overlap.
- **Validation:** `startTime` must be before `endTime`.

---

## When a user is deleted (Admin)

All bookings belonging to that user are **deleted** first, then the user is removed.
