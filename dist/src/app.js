"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const celebrate_1 = require("celebrate");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const config_1 = require("../config");
const common_1 = require("./helpers/common");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const swagger_1 = __importDefault(require("./swagger"));
const passport_1 = __importDefault(require("./auth/passport"));
const jwtMiddlewareCookie_1 = __importDefault(require("./middlewares/jwtMiddlewareCookie"));
const app = (0, express_1.default)();
// ### Session + Cookies ### //
const sess = {
    name: 'gr.auth.token',
    keys: [config_1.env.GUARDRAILS_SESSION_KEY_1, config_1.env.GUARDRAILS_SESSION_KEY_2],
    maxAge: 2 * 60 * 60 * 1000,
    domain: (0, common_1.getDomain)(),
    sameSite: 'lax',
    httpOnly: !config_1.env.DISABLE_HTTPONLY_COOKIES,
    secureProxy: !config_1.env.DISABLE_SECURE_COOKIES
};
app.set('trust proxy', 1); // trust first proxy
app.use((0, cookie_session_1.default)(sess));
app.use((0, cors_1.default)({
    origin: (0, common_1.corsOrigin)(),
    optionsSuccessStatus: 200,
    credentials: true
}));
// ### Base Middlewares ### //
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_fileupload_1.default)());
// ### Auth ### //
(0, passport_1.default)(app);
// ### Response Header Security ### //
app.use((0, helmet_1.default)());
app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", 'data:']
    }
}));
app.use(helmet_1.default.referrerPolicy({ policy: 'strict-origin' }));
app.use(helmet_1.default.frameguard({ action: 'deny' }));
app.use(helmet_1.default.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false
}));
// ### Swagger ### //
app.use('/swagger', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, { explorer: true }));
app.get('/swagger.json', (req, res) => res.status(200).send(swagger_1.default));
// ### Routes ### //
app.use(routes_1.default);
app.get('/token', jwtMiddlewareCookie_1.default, (req, res) => res.status(200).send(req.session.jwt));
app.get('/logout', async (req, res) => {
    if (req.session) {
        req.session = null;
    }
    return res.status(200).send('ok');
});
app.get('/healthcheck', (req, res) => res.status(200).send({ status: 'ok' }));
app.get('*', async (req, res) => res.redirect(config_1.constants.websiteUrl));
app.use((0, celebrate_1.errors)());
// ### Errors ### //
app.use(errorHandler_1.default);
module.exports = app;
//# sourceMappingURL=app.js.map