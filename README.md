# RouteStitcher Backend

Backend service for finding available train tickets and stitching routes into multiple ticket segments when a direct ticket is unavailable.

## Overview

RouteStitcher solves a common problem when travelling by train: a ticket may not be available for the entire route, while seats are available for individual parts of the journey.

The application checks train availability and can split a journey into several segments to find a route with sufficient seat availability.

For example:

```text
Łódź → Bydgoszcz

Direct ticket: unavailable

Available:
Łódź → Kutno
Kutno → Bydgoszcz
```


RouteStitcher finds such combinations and returns the available route segments.

## Features
- Train connection availability checking
- Seat availability checking
- Place class selection
- Route splitting into multiple tickets
- Route coverage calculation
- Best route variant selection
- Technologies
- Node.js
- Express.js
- JavaScript
- Jest

## Installation
```text
git clone <repository-url>
cd RouteStitcher-backend
npm install
```

Create a .env file with the required API configuration.

## Running
```text
npm run dev
```
## Testing
```text
npm test
```
