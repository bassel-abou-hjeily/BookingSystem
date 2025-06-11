Tick'it Booking System – Seat Locking & Conflict Resolution

Problem Summary

The booking system allowed multiple users to reserve and pay for the same seats concurrently, resulting in double booking. This happened because there was no mechanism to lock selected seats during the checkout process, leaving a time window where seats were still marked as available.

Goals of the Solution

Prevent multiple users from selecting or booking the same seats at the same time.

Implement a temporary locking mechanism for seats during checkout.

Auto-release locks after a timeout or upon checkout abandonment.

Ensure atomicity and consistency in the booking process.

Solution Overview

1. Seat Locking Mechanism

A new collection SeatLocks is introduced with the following schema:

SeatLock {
  _id: ObjectId,
  seatID: string,
  eventID: string,
  customerID: string,
  lockedAt: Date,
  expiresAt: Date
}

When a user selects seats for checkout, the system locks the seats for a limited time (e.g., 15 minutes).

Locked seats are excluded from availability in the seat selection API.

Lock is released when:

The customer completes checkout (seat becomes officially booked).

The lock expires.

The customer cancels the process.

2. Updated APIs

GET /api/events/:eventID/seats

Now filters out seats that are:

Marked as isTaken = true

Or currently locked and lock is not expired

POST /api/events/:eventID/lock-seats

Input: seatIDs: string[]

Checks if requested seats are already taken or locked

If available, creates locks with expiration timestamp

POST /api/events/:eventID/confirm-booking

Input: seatIDs, orderID, etc.

Checks that the seats are still locked by the customer

Marks seats as taken and creates a reservation

Deletes corresponding locks

3. Lock Expiration Handling

A background job or middleware checks and clears expired seat locks regularly (e.g., every minute).

Locks older than the expiration window are removed, making the seats available again.

How It Solves the Problem

Ensures that only one customer can lock a seat at a time.

Makes concurrent selection and booking of the same seat impossible.

Prevents abuse by auto-releasing locks that are not followed by a payment.

Makes the seat booking system race-condition proof by leveraging atomic operations.

Real-World Scenario

Customer X selects A2, A3 → SeatLocks created for these.

Customer Y tries to select A2 → SeatLock check fails, seat marked as temporarily unavailable.

Customer X pays and confirms booking → Seats marked as taken, SeatLocks deleted.

If Customer X abandons payment → SeatLocks expire, seats return to pool.

Database Models Summary

New Collection

SeatLocks

Field    Type   Description

seatID   String  Seat being locked

eventID  String  Event identifier

customerID String Who locked the seat

lockedAt Date When it was locked

expiresAt Date When it will auto-release

Modified Collection
Seats

Added: isTaken boolean remains unchanged but availability now also depends on lock status.

Final Notes

This design is scalable and easily supports distributed deployments.

For production, ensure seat locks are created with atomic DB operations and consider TTL indexes on the SeatLocks collection.

This structure also enables future features like seat selection expiration countdown for the user.

