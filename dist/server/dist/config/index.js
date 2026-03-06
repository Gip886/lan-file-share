"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    jwtExpiresIn: '7d',
    databaseUrl: process.env.DATABASE_URL || 'file:../../../data/database.db',
    staticDir: path_1.default.join(__dirname, '../../../data/static'),
    uploadDir: path_1.default.join(__dirname, '../../../data/uploads'),
    thumbnailDir: path_1.default.join(__dirname, '../../../data/thumbnails'),
};
var database_1 = require("./database");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return database_1.prisma; } });
//# sourceMappingURL=index.js.map