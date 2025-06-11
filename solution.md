# Tick'it Booking System – Seat Locking & Conflict Resolution

## Problem Summary

The booking system allowed multiple users to reserve and pay for the same seats at the same time, causing double bookings. This happened because there was no locking mechanism to temporarily hold seats during checkout.

## Goals of the Solution

- Prevent multiple users from selecting or booking the same seats simultaneously.
- Temporarily lock seats during the checkout process.
- Automatically release locks after timeout or if the user cancels.
- Ensure atomic and consistent seat reservation.

---

## Solution Overview

### 1. **Seat Locking Mechanism**

A new collection `SeatLocks` is introduced:

```ts
SeatLock {
  _id: ObjectId,
  lockID: string,
  seatIDs: ObjectId[],
  eventID: ObjectId,
  customerID: ObjectId,
  lockedAt: Date,
  expiresAt: Date
}
```

- When a user selects seats, the system locks them for a limited time (e.g., 5 minutes).
- Locked seats are excluded from seat availability.
- Locks are released when:
  - The user completes booking.
  - The user cancels selection.
  - The lock expires.

### 2. **Updated APIs**

#### `GET /api/events/:eventID/seats`

- Returns all seats of the event with their status:
  - `available`: seat is not taken or locked
  - `locked`: seat is temporarily locked
  - `taken`: seat is officially booked

#### `POST /api/events/:eventID/lock-seats`

- Input: `seatIDs[]`, `customerID`
- Locks seats for the customer if not already taken or locked.
- Fails if any seat is already taken or currently locked.

#### `POST /api/events/:eventID/unlock-seats`

- Input: `seatIDsToUnlock[]`, `customerID`
- Unlocks specific seats locked by the customer.
- Deletes the lock if all seats are removed.

### 3. **Lock Expiration Handling**

- Expired seat locks are auto-removed by a background task or TTL index.
- Ensures seats return to the pool if not booked.

---

## How It Solves the Problem

- Only one customer can lock a seat at any time.
- Prevents race conditions by ensuring locked seats are excluded.
- Frees up seats if the user does not proceed to payment.

---

## Real-World Scenario

1. Customer X selects A2, A3 → Locks created.
2. Customer Y tries A2 → Marked as locked.
3. Customer X pays → Seats marked as taken, locks removed.
4. Customer X cancels or time expires → Locks removed, seats available again.

---

## Database Models Summary

### SeatLocks Collection

| Field      | Type       | Description                 |
| ---------- | ---------- | --------------------------- |
| lockID     | String     | Unique lock identifier      |
| seatIDs    | ObjectId[] | List of locked seats        |
| eventID    | ObjectId   | Associated event            |
| customerID | ObjectId   | Customer who locked seats   |
| lockedAt   | Date       | Time when seats were locked |
| expiresAt  | Date       | Lock expiration time        |

### Seats Collection

- `isTaken`: boolean — true if seat is officially booked.
- Availability now also depends on whether the seat is locked.

---

## Final Notes

- Atomic operations and DB sessions ensure race conditions are avoided.
- TTL indexes can be used for auto-expiring seat locks.
- Unlock API allows partial seat cancellation before booking confirmation.
- Supports scalability and future features like countdown timers for seat hold duration.

