"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Logger {
    constructor() {
        this.logFilePath = process.env.LOG_FILE;
        this.logLevel = this.getLogLevel();
        this.ensureLogFileExists();
    }
    getLogLevel() {
        const level = parseInt(process.env.LOG_LEVEL);
        return level;
    }
    ensureLogFileExists() {
        const dir = path_1.default.dirname(this.logFilePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(this.logFilePath)) {
            fs_1.default.writeFileSync(this.logFilePath, "", "utf-8");
        }
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `${timestamp} [${level}]: ${message}\n`;
    }
    log(level, message) {
        if (level <= this.logLevel) {
            const levelString = this.getLevelString(level);
            const formattedMessage = this.formatMessage(levelString, message);
            fs_1.default.appendFileSync(this.logFilePath, formattedMessage, "utf-8");
        }
    }
    getLevelString(level) {
        switch (level) {
            case 1:
                return "INFO";
            case 2:
                return "DEBUG";
            default:
                return "SILENT";
        }
    }
}
exports.Logger = Logger;
