const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const tagsRoutes = require('./routes/tags');
const goalsRoutes = require('./routes/goals');
const activityRoutes = require('./routes/activity');
const notificationsRoutes = require('./routes/notifications');
const remindersRoutes = require('./routes/reminders');
const backupsRoutes = require('./routes/backups');
const gamificationRoutes = require('./routes/gamification');

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/gamification', gamificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
