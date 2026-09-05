# RouteStitcher Backend

Express.js backend for finding available train tickets and stitching routes into multiple ticket segments when a direct ticket is unavailable.

## Overview

RouteStitcher checks train and seat availability through the KOLEO API. When a direct ticket is unavailable, it searches for a combination of segments with sufficient availability.

For example:

```text
Łódź → Bydgoszcz

Direct ticket: unavailable

Available:
Łódź → Kutno
Kutno → Bydgoszcz
```


The API returns direct, split-ticket, or standing route variants.

## Features
- Train connection availability checking
- Seat availability checking
- Place class selection
- Route splitting into multiple tickets
- Route coverage calculation
- Best route variant selection

## Technologies
- Node.js
- Express.js
- JavaScript
- Jest

## Installation
Requirements: Node.js 18 or newer and KOLEO API credentials.

```bash
git clone <repository-url>
cd RouteStitcher-backend
npm install
```

Create a `.env` file in the project root:

```dotenv
KOLEO_EMAIL=your-email
KOLEO_PASSWORD=your-password
KOLEO_GRANT_TYPE=password
KOLEO_CLIENT_ID=your-client-id
```

Do not commit `.env` or `data/token.json`; both may contain sensitive authentication data.

## Running

Start the development server on `http://localhost:5000`:

```bash
npm run dev
```

## API

Get stations and commercial brands:

```http
GET /api/stations
GET /api/brands
```

Search connections. `departure`, `destination`, and `date` are required query parameters; `limit` is optional:

```http
GET /api/search?departure=station-id&destination=station-id&date=2026-09-05&limit=10
```

Check availability for a connection. `tickets` is required; `placeClass` is optional:

```http
POST /api/{connectionUUID}/check
Content-Type: application/json

{
	"tickets": 3,
	"placeClass": 2
}
```

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```
