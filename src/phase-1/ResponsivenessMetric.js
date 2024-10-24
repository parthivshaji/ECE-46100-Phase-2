"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsivenessMetric = void 0;
const Metrics_js_1 = require("./Metrics.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class ResponsivenessMetric extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
        this.filteredIssues = [];
        logger.log(1, "ResponsivenessMetric instance created."); // Info level
    }
    calculateScore() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.filteredIssues = this.githubData.Closed_Issues || [];
            logger.log(2, `Number of closed issues: ${this.filteredIssues.length}`); // Debug level
            if (this.filteredIssues.length === 0) {
                logger.log(1, "No closed issues found, returning default score: 0.25"); // Info level
                return 0.25;
            }
            let standard_no_of_issues = 0;
            const repoSize = (_b = (_a = this.githubData) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
            logger.log(2, `Repository size (KB): ${repoSize}`); // Debug level
            if (repoSize / 1000 >= 100) {
                standard_no_of_issues = 120;
                logger.log(2, "Repository size > 100MB, standard number of issues set to 120."); // Debug level
            }
            else if (repoSize / 1000 > 50) {
                standard_no_of_issues = 90;
                logger.log(2, "Repository size > 50MB, standard number of issues set to 90."); // Debug level
            }
            else {
                standard_no_of_issues = 80;
                logger.log(2, "Repository size <= 50MB, standard number of issues set to 80."); // Debug level
            }
            if (this.filteredIssues.length > standard_no_of_issues) {
                logger.log(1, "Number of closed issues exceeds standard, returning score: 1"); // Info level
                return 1;
            }
            const score = Math.max(this.filteredIssues.length / standard_no_of_issues, 0);
            logger.log(2, `Calculated responsiveness score: ${score}`); // Debug level
            return score;
        });
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            const start = performance.now();
            logger.log(1, "Calculating responsiveness score with latency..."); // Info level
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(2, `Score calculated: ${score}, Latency: ${latency} ms`); // Debug level
            return { score, latency };
        });
    }
}
exports.ResponsivenessMetric = ResponsivenessMetric;
