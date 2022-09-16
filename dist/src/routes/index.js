"use strict";
const { Router } = require('express');
const routerV2 = require('./v2');
const router = Router();
// routes for v2
router.use('/v2', routerV2);
module.exports = router;
//# sourceMappingURL=index.js.map