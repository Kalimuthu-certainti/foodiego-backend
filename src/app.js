"use strict";

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { config } = require("./config");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

/**
 * Express application wiring. This module exports the configured app but does
 * NOT call listen() — that belongs to server.js so tests can import the app
 * directly with Supertest.
 */
const app = express();

// CORS — the frontend is a separate app on a different origin (the two-repo
// setup), so browsers block its API calls unless we whitelist that origin.
// Allowed origins come from config.frontendUrls (FRONTEND_URL env). Auth uses a
// Bearer token in the Authorization header (not cookies), so credentials mode is
// not needed. The cors() middleware also answers CORS preflight (OPTIONS) calls.
app.use(cors({ origin: config.frontendUrls }));

// Parse JSON request bodies into req.body for the route handlers.
app.use(express.json());

// Lightweight liveness probe (no auth).
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Domain routers, all mounted under /api.
app.use("/api", routes);

// Fall-throughs: unknown route -> 404, then central error formatter.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
