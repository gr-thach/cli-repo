"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadUrl = void 0;
const minio_1 = __importDefault(require("../services/minio"));
const getUploadUrl = async (key) => {
    return minio_1.default.getUploadUrl(key);
};
exports.getUploadUrl = getUploadUrl;
//# sourceMappingURL=cli.js.map