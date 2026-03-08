---
title: An Idempotency Checklist for Distributed Systems
---

# An Idempotency Checklist for Distributed Systems

Idempotency is often reduced to one sentence: “repeating the same request should produce the same result.” That is directionally correct, but it is not enough in real systems.

You also need to control side effects: database writes, message delivery, charging, coupon issuance, and third-party calls.

## 1. Define the idempotency boundary first

The first task is not code. It is deciding what counts as the same request.

Most systems introduce an idempotency key, but the key must be tied to business meaning:

- the same order creation request;
- the same payment confirmation;
- the same one-time tenant initialization.

If the key is just a random UUID with no business constraint behind it, the real problem has only been postponed.

## 2. Do not store only the final response

A common implementation caches the successful response body and returns it on later hits. That works for simple cases, but complex flows need explicit state.

A safer model is a small state machine:

- `processing`
- `succeeded`
- `failed-retryable`
- `failed-terminal`

This lets you distinguish “the first execution is still in progress” from “the work already finished,” and it prevents concurrent retries from advancing multiple side effects.

## 3. Separate durable writes from side effects

If a request writes to the database and also sends messages, calls third parties, or emits notifications, a unique database constraint alone is not enough.

It can protect the primary record, but it does not naturally protect external side effects.

### A stronger composition

1. Guard the main write with the idempotency key.
2. Write an outbox record in the same transaction.
3. Let an async dispatcher deliver that outbox event.
4. Keep consumer-side idempotency as well.

That splits “request committed” from “side effect delivered” into two recoverable phases.

## 4. Concurrent collisions are the real test

The most underestimated case is the same idempotency key hitting two instances almost simultaneously.

If the flow is “check first, then decide whether to write,” it almost certainly has a race condition. Better options include:

- atomically creating the idempotency record with a unique constraint or conditional write;
- having later requests react to a `processing` state by waiting, polling, or failing fast;
- setting recovery timeouts so a crashed instance does not leave the key blocked forever.

## 5. Idempotency records need a lifecycle

Not every idempotency key should live forever. Different domains need different retention windows:

- payment confirmations might need days;
- duplicate form submission protection might need minutes;
- message deduplication might follow the message retention period.

If TTL is too short, duplicate side effects reappear. If it is too long, storage cost and false matches grow. The right window depends on your compensation model.

## 6. A practical checklist

Before shipping an idempotent write path, confirm:

1. the key is bound to business meaning;
2. the record has explicit state, not only a cached response;
3. durable writes and external side effects are separated;
4. concurrent requests for the same key are handled safely;
5. TTL, recovery, and operator workflows are defined.

Idempotency is not a feature added for retries. It is infrastructure that prevents duplicate side effects from spreading through a distributed system.
