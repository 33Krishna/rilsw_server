import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/database';
import routes from './routes';
import { config } from './config/config';

const app = express();

// CORS configuration for Render.com deployment
app.use(cors({ 
  origin: [
    config.CORS_ORIGIN,
    'https://www.evxlab.co.in',
    'https://evxlab.co.in',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.CLIENT_URL
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const allowedOrigins = [
    config.CORS_ORIGIN,
    'https://www.evxlab.co.in',
    'https://evxlab.co.in',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.CLIENT_URL
  ].filter((origin): origin is string => Boolean(origin));
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(cookieParser());

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.use('/api', routes);

const PORT = config.PORT || 5000;

connectDB().then(() => {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 