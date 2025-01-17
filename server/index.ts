import path from "path";
import express, { Request, Response, NextFunction } from 'express';
import pino from 'express-pino-logger';
import config from './config/environment';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api';

const app = express();
const logger = pino();

declare global {
  var cache: {
    [resource: string]: {
      time: Date,
      data: any,
    }
  };
}
global.cache = {};

app.use(logger); // logging framework
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute window
  max: 2000, // Limit each IP to 2000 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('Time:', Date.now());
  next();
});
app.use('/api', apiLimiter);
app.use('/api', apiRouter);

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'development') {
  // Serve any static files
  let dirname = __dirname.replace("/server", "")
  app.use(express.static(path.join(dirname, 'client/dist/angular-boilerplate'),{maxAge:3600000}));

  // Handle app routing, return all requests to ngx app
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(dirname, 'client/dist/angular-boilerplate', 'index.html'));
  });
}

app.listen(config.server_port || 3000, () => {
  console.log('Express server is running on ' + (config.server_port || 3000))
});