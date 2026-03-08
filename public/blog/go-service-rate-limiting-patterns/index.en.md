---
title: Practical Rate Limiting Patterns for Go Services
---

# Practical Rate Limiting Patterns for Go Services

Rate limiting is not about making APIs slower. It is about rejecting the right traffic when capacity is finite, so that your most important requests and dependencies survive.

In Go services, stable rate limiting is usually layered. The strongest designs combine edge controls, per-instance protection, and shared-state enforcement.

## 1. Start with three questions

Before you write code, answer these:

1. What are you protecting: CPU, connection pools, or a downstream quota?
2. What is the limiting dimension: user, IP, tenant, or endpoint?
3. What should happen when the limit is exceeded: reject, queue, or degrade?

These answers determine both the algorithm and the layer.

## 2. When to choose each algorithm

### Token bucket

Token bucket is a good default when you want to allow short bursts. Requests pass while tokens are available, then wait or fail when the bucket is empty.

It is simple, fast, and well suited to per-endpoint protection.

### Sliding window

Sliding window is better when the limit must be statistically strict, such as “no more than N requests per minute.”

It smooths out boundary spikes better than a fixed window, but it costs more in implementation and storage.

### Leaky bucket or queues

If the goal is traffic shaping rather than immediate rejection, leaky bucket behavior or job queues work better. This is common for SMS delivery, payment calls, or batch writes.

## 3. Divide responsibilities across three layers

### Edge layer

Apply coarse-grained limits in your API gateway or ingress to block obvious abuse:

- large IP-based spikes;
- aggressive anonymous scraping;
- low-value endpoints being scanned at scale.

The edge layer should cheaply remove noise.

### Service instance layer

Use lightweight in-process token buckets to protect goroutines, CPU, and connection pools. This path has no network round trip and reacts the fastest.

It fits:

- per-instance concurrency protection;
- local gates in front of expensive dependencies;
- fast protection for hot endpoints.

### Shared-state layer

If the rule must stay consistent across instances, introduce Redis or another shared counter store. This is where you enforce tenant-wide budgets and auditable quotas.

## 4. Two Redis details teams often miss

Many teams focus on Lua script atomicity and miss the two more common problems.

### Hot keys

If a single tenant or endpoint dominates traffic, one Redis key can become its own bottleneck. Sharding, partial local caching, or isolating extreme tenants may be necessary.

### Failure fallback

When Redis is degraded, does your service fail open, fail closed, or protect only critical paths? That decision should be explicit before an incident happens.

## 5. Observability matters more than algorithm names

The hard part is rarely implementing a token bucket. The hard part is knowing whether you placed the limit in the right spot.

At minimum, track:

- hits and rejections per rule;
- which tenants, users, and endpoints are being throttled;
- downstream latency before and after throttling;
- error rates in the rate limiting layer itself.

## 6. A pragmatic rollout path

If your service has no rate limiting today, do not begin with the perfect global design. A safer rollout is:

1. coarse limits at the edge;
2. local token buckets around the most expensive endpoints;
3. shared-state rules only when the business truly needs cross-instance fairness.

Rate limiting is capacity management, not algorithm theater. Protect the most expensive and most fragile resources first, then refine the implementation.
