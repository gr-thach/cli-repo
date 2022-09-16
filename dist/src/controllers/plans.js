"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const stripe_1 = __importDefault(require("../services/stripe"));
const plans_1 = require("../helpers/core-api/plans");
const plans_2 = require("../helpers/plans");
const list = async (req, res) => {
    const stripeService = new stripe_1.default();
    const [plans, stripePrices] = await Promise.all([
        (0, plans_1.findAllPlans)(),
        stripeService.getAllPrices(true)
    ]);
    return res.status(200).send((0, plans_2.mapPlansWithStripePrices)(plans, stripePrices));
};
exports.list = list;
//# sourceMappingURL=plans.js.map