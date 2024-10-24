"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPMData = void 0;
const logger_js_1 = require("./logger.js");
class NPMData {
    constructor(license = "empty", githubUrl = "empty", latency = 0) {
        this.license = license;
        this.githubUrl = githubUrl;
        this.latency = latency;
    }
    printMyData() {
        const logger = new logger_js_1.Logger();
        logger.log(2, "NPM Data:");
        logger.log(2, `License: ${this.license}`);
        logger.log(2, `GitHub URL: ${this.githubUrl}`);
    }
}
exports.NPMData = NPMData;
