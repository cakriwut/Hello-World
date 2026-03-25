'use strict';

const express = require('express');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

const app = express();

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => {
      const existing = req.headers['x-request-id'];
      return existing || uuidv4();
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} errored: ${err.message}`;
    },
    customAttributeKeys: {
      req: 'req',
      res: 'res',
      err: 'err',
      responseTime: 'responseTime',
    },
  })
);

// Attach request id to response header
app.use((req, res, next) => {
  res.setHeader('x-request-id', req.id);
  next();
});

app.get('/', (req, res) => {
  req.log.info({ path: '/' }, 'GET / called');
  res.json({ message: 'Hello World', requestId: req.id });
});

app.get('/health', (req, res) => {
  req.log.info({ path: '/health' }, 'health check');
  res.json({ status: 'ok', requestId: req.id });
});

app.get('/error', (req, res) => {
  req.log.error({ path: '/error' }, 'simulated error endpoint');
  res.status(500).json({ error: 'Internal Server Error', requestId: req.id });
});

app.get('/warn', (req, res) => {
  req.log.warn({ path: '/warn' }, 'simulated warn endpoint');
  res.json({ warn: true, requestId: req.id });
});

app.get('/debug', (req, res) => {
  req.log.debug({ path: '/debug' }, 'simulated debug endpoint');
  res.json({ debug: true, requestId: req.id });
});

module.exports = app;
