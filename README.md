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
