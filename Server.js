// Minimal cloud demo: Express + in-memory data + GPS simulation (Lagos routes)
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const companies = [
  { id: "c-jet", name: "JetCommute Nigeria Ltd." },
  { id: "c-swift", name: "SwiftMove Corporate Transport" }
];

const routes = [
  {
    id: "r-ikeja-vi", company_id: "c-jet", name: "Ikeja to Victoria Island – Morning",
    stops: [
      { id: "s-ikeja-mall", name: "Ikeja City Mall", lat: 6.6018, lon: 3.3515 },
      { id: "s-maryland", name: "Maryland Bus Stop", lat: 6.5740, lon: 3.3715 },
      { id: "s-ojuelegba", name: "Ojuelegba", lat: 6.5095, lon: 3.3679 },
      { id: "s-cms", name: "CMS Bus Terminal", lat: 6.4541, lon: 3.3958 },
      { id: "s-vi-ajose", name: "VI Ajose Adeogun", lat: 6.4281, lon: 3.4216 }
    ]
  },
  {
    id: "r-lekki-yaba", company_id: "c-swift", name: "Lekki to Yaba – Evening",
    stops: [
      { id: "s-admiralty", name: "Admiralty Way Lekki", lat: 6.4401, lon: 3.4524 },
      { id: "s-ikate", name: "Ikate Bus Stop", lat: 6.4483, lon: 3.4486 },
      { id: "s-obalende", name: "Obalende", lat: 6.4471, lon: 3.4068 },
      { id: "s-onikan", name: "Onikan Stadium", lat: 6.4452, lon: 3.4025 },
      { id: "s-yaba", name: "Yaba Tech Gate", lat: 6.5126, lon: 3.3796 }
    ]
  }
];

const trips = [
  { id: "t-jet-01", route_id: "r-ikeja-vi", vehicle: "JET-BUS-01", status: "ongoing" },
  { id: "t-swift-09", route_id: "r-lekki-yaba", vehicle: "SWIFT-BUS-09", status: "ongoing" }
];

const bookings = []; // { id, user_email, trip_id, stop_id, status, paid, created_at }

const pathByRoute = {};
routes.forEach(r => { pathByRoute[r.id] = r.stops.map(s => ({ lat: s.lat, lon: s.lon, stopId: s.id })); });

const positions = {
  "t-jet-01": { i: 0, lat: pathByRoute["r-ikeja-vi"][0].lat, lon: pathByRoute["r-ikeja-vi"][0].lon },
  "t-swift-09": { i: 0, lat: pathByRoute["r-lekki-yaba"][0].lat, lon: pathByRoute["r-lekki-yaba"][0].lon }
};

// Move each bus to next stop every 5s and auto-complete bookings at that stop
setInterval(() => {
  for (const t of trips) {
    const path = pathByRoute[t.route_id];
    if (!path || path.length === 0) continue;
    const p = positions[t.id];
    p.i = (p.i + 1) % path.length;
    p.lat = path[p.i].lat;
    p.lon = path[p.i].lon;
    const currentStopId = path[p.i].stopId;
    bookings
      .filter(b => b.trip_id === t.id && b.stop_id === currentStopId && b.status === 'booked')
      .forEach(b => b.status = 'completed');
  }
}, 5000);

// --- API ---
app.get('/healthz', (_, res) => res.json({ ok: true }));
app.get('/companies', (_, res) => res.json(companies));
app.get('/routes', (req, res) => {
  const { company_id } = req.query;
  res.json(company_id ? routes.filter(r => r.company_id === company_id) : routes);
});
app.get('/trips', (_, res) => res.json(trips));
app.get('/trips/:tripId/position', (req, res) => {
  const pos = positions[req.params.tripId];
  if (!pos) return res.status(404).json({ error: 'trip not found' });
  res.json({ lat: pos.lat, lon: pos.lon, timestamp: new Date().toISOString() });
});
app.post('/bookings', (req, res) => {
  const { user_email, trip_id, stop_id, payment_test } = req.body || {};
  if (!user_email || !trip_id || !stop_id) return res.status(400).json({ error: 'user_email, trip_id, stop_id required' });
  if (!trips.find(t => t.id === trip_id)) return res.status(404).json({ error: 'trip not found' });
  const id = 'b-' + Math.random().toString(36).slice(2, 8);
  const paid = !!payment_test;
  const booking = { id, user_email, trip_id, stop_id, status: 'booked', paid, created_at: new Date().toISOString() };
  bookings.push(booking);
  res.status(201).json({ booking_id: id, status: booking.status, paid, fare: 100, currency: 'NGN' });
});
app.get('/bookings', (req, res) => {
  const { user_email } = req.query;
  res.json(user_email ? bookings.filter(b => b.user_email === user_email) : bookings);
});

app.listen(PORT, () => console.log(`Demo listening on :${PORT}`));
