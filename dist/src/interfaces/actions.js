"use strict";
// type ActionObject = { [key: string]: string | number | boolean | undefined | null };
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.ActionStatus = void 0;
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["APPROVED"] = "APPROVED";
    ActionStatus["PENDING"] = "PENDING";
    ActionStatus["REJECTED"] = "REJECTED";
})(ActionStatus = exports.ActionStatus || (exports.ActionStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["WONT_FIX"] = "WONT_FIX";
    ActionType["FALSE_POSITIVE"] = "FALSE_POSITIVE";
    ActionType["MARK_AS_FIXED"] = "MARK_AS_FIXED";
    ActionType["MARK_AS_VULNERABILITY"] = "MARK_AS_VULNERABILITY";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
//# sourceMappingURL=actions.js.map