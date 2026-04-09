require('./config/env'); // Validate env vars on startup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const membersRoutes = require('./routes/members.routes');
const flatsRoutes = require('./routes/flats.routes');
const circularsRoutes = require('./routes/circulars.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const auditLogsRoutes = require('./routes/auditLogs.routes');
const pollsRoutes = require('./routes/polls.routes');
const communityContactsRoutes = require('./routes/communityContacts.routes');

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Logging
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files — only whitelisted extensions
app.use(
  '/api/files',
  (req, res, next) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx', '.doc'];
    const ext = path.extname(req.path).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return res.status(403).json({ message: 'File type not servable' });
    }
    next();
  },
  express.static(path.resolve(env.uploadDir))
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/flats', flatsRoutes);
app.use('/api/circulars', circularsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/community-contacts', communityContactsRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler
app.use(errorHandler);

module.exports = app;
