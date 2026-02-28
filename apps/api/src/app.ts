import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { getAppConfig } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import bonusRoutes from './routes/bonus.routes.js';
import kpiRoutes from './routes/kpi.routes.js';
import syncRoutes from './routes/sync.routes.js';
import tierRoutes from './routes/tier.routes.js';

const config = getAppConfig();

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'tiny'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/tiers', tierRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);
