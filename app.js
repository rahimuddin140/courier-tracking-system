require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const trackRoutes = require('./routes/trackRoutes');
const customerRoutes = require('./routes/customerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const currentPort = process.env.PORT || 4000;

// 1. View Engine Setup (EJS + SSR Layouts)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// 2. Body parsers & static assets
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Ensure Database connection before handling requests (Serverless-friendly)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err);
    next(err);
  }
});

// 4. Session configuration with MongoDB Session Store
const hasValidMongoUri = process.env.MONGO_URI && 
  !process.env.MONGO_URI.includes('<username>') && 
  !process.env.MONGO_URI.includes('<db_password>');

const sessionStore = hasValidMongoUri
  ? MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60 // 14 days
    })
  : undefined;

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'courier-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// 5. Flash messaging middleware
app.use(flash());

// 6. Global variables for all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user || null : null;
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// 7. Route Handlers
// Public landing page
app.get('/', (req, res) => {
  res.render('landing', { title: 'FastTrack Logistics - Fast & Reliable Courier Services' });
});

// Mount modular route groups
app.use('/', authRoutes);
app.use('/', trackRoutes);
app.use('/customer', customerRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);

// 8. 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Page Not Found',
    layout: 'layouts/main'
  });
});

// 9. Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('500', {
    title: '500 - Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred.',
    layout: 'layouts/main'
  });
});

// 10. Standalone Server Start (when run directly e.g. node app.js)
if (require.main === module) {
  connectDB().then(() => {
    const server = app.listen(currentPort, () => {
      console.log(`🚀 Courier & Parcel Delivery System server running at http://localhost:${server.address().port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(currentPort) + 1;
        console.log(`⚠️  Port ${currentPort} is in use, auto-retrying on port ${nextPort}...`);
        server.listen(nextPort);
      } else {
        console.error('Server error:', err);
      }
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
}

module.exports = app;
