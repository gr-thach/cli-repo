import 'express-async-errors';
import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import cookieSession from 'cookie-session';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errors } from 'celebrate';
import fileUpload from 'express-fileupload';
import { env, constants } from '../config';
import { getDomain, corsOrigin } from './helpers/common';
import router from './routes';
import errorHandler from './middlewares/errorHandler';
import swaggerSpec from './swagger';
import initPassport from './auth/passport';
import jwtMiddlewareCookie from './middlewares/jwtMiddlewareCookie';

const app = express();

// ### Session + Cookies ### //
const sess = {
  name: 'gr.auth.token',
  keys: [env.GUARDRAILS_SESSION_KEY_1, env.GUARDRAILS_SESSION_KEY_2],
  maxAge: 2 * 60 * 60 * 1000, // 2 hs
  domain: getDomain(),
  sameSite: 'lax',
  httpOnly: !env.DISABLE_HTTPONLY_COOKIES,
  secureProxy: !env.DISABLE_SECURE_COOKIES
};

app.set('trust proxy', 1); // trust first proxy

app.use(cookieSession(sess));

app.use(
  cors({
    origin: corsOrigin(),
    optionsSuccessStatus: 200,
    credentials: true
  })
);

// ### Base Middlewares ### //
app.use(logger('dev'));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// ### Auth ### //
initPassport(app);

// ### Response Header Security ### //
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", 'data:']
    }
  })
);
app.use(helmet.referrerPolicy({ policy: 'strict-origin' }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false
  })
);

// ### Swagger ### //
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/swagger.json', (req, res) => res.status(200).send(swaggerSpec));

// ### Routes ### //
app.use(router);

app.get('/token', jwtMiddlewareCookie, (req, res) => res.status(200).send(req.session.jwt));

app.get('/logout', async (req, res) => {
  if (req.session) {
    req.session = null;
  }

  return res.status(200).send('ok');
});

app.get('/healthcheck', (req, res) => res.status(200).send({ status: 'ok' }));

app.get('*', async (req, res) => res.redirect(constants.websiteUrl));

app.use(errors());
// ### Errors ### //
app.use(errorHandler);

module.exports = app;
