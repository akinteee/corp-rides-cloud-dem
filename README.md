# Corporate Rides – Cloud Demo (In-Memory)

Endpoints after deploy:
- GET /healthz
- GET /companies
- GET /routes?company_id=c-jet
- GET /trips
- GET /trips/t-jet-01/position
- POST /bookings  (JSON: { "user_email":"you@example.com", "trip_id":"t-jet-01", "stop_id":"s-ojuelegba", "payment_test":true })
- GET /bookings?user_email=you@example.com
