package middleware

import (
	"time"
)

type RateLimiter struct {
	requests map[string]*clientRequest
}

type clientRequest struct {
	count     int
	resetTime time.Time
	blocked  bool
}

func NewRateLimiter() *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*clientRequest),
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	for {
		time.Sleep(time.Minute)
		now := time.Now()
		for ip, req := range rl.requests {
			if req.resetTime.Before(now) && !req.blocked {
				delete(rl.requests, ip)
			}
		}
	}
}

func (rl *RateLimiter) allow(ip string, maxReq int, window time.Duration) bool {
	now := time.Now()
	req, exists := rl.requests[ip]

	if !exists {
		rl.requests[ip] = &clientRequest{
			count:     1,
			resetTime: now.Add(window),
		}
		return true
	}

	if req.blocked {
		return false
	}

	if req.resetTime.Before(now) {
		req.count = 0
		req.resetTime = now.Add(window)
	}

	if req.count >= maxReq {
		req.blocked = true
		req.resetTime = now.Add(15 * time.Minute)
		return false
	}

	req.count++
	return true
}