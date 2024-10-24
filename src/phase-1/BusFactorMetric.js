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
exports.BusFactorMetric = void 0;
// BusFactorMetric.ts
const Metrics_js_1 = require("./Metrics.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class BusFactorMetric extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
        logger.log(2, "BusFactorMetric initialized.");
    }
    calculateScore() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(2, "Calculating BusFactor score...");
            const totalCommits = this.totalCommits();
            if (totalCommits <= 0) {
                logger.log(1, "No commits found in the repository.");
                return 0; // Handle case where there are no commits
            }
            logger.log(2, `Total commits: ${totalCommits}`);
            const hhi = this.HHI(totalCommits);
            logger.log(2, `HHI (Herfindahl-Hirschman Index): ${hhi}`);
            const busFactor = Math.max(0, 1 - hhi);
            logger.log(1, `Calculated BusFactor: ${busFactor}`);
            return busFactor;
        });
    }
    totalCommits() {
        var _a;
        let totalCommits = 0;
        if ((_a = this.githubData.contributions) === null || _a === void 0 ? void 0 : _a.length) {
            for (let i = 0; i < this.githubData.contributions.length; i++) {
                totalCommits += this.githubData.contributions[i].commits;
            }
        }
        logger.log(2, `Total commits calculated: ${totalCommits}`);
        return totalCommits;
    }
    HHI(totalCommits) {
        var _a;
        let hhi = 0;
        if ((_a = this.githubData.contributions) === null || _a === void 0 ? void 0 : _a.length) {
            for (let i = 0; i < this.githubData.contributions.length; i++) {
                const share = this.githubData.contributions[i].commits / totalCommits;
                hhi += share * share; // Sum of squared shares
            }
        }
        logger.log(2, `HHI calculated: ${hhi}`);
        return hhi; // Value is between 0 and 1
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(2, "Measuring latency for BusFactor score calculation...");
            const start = performance.now();
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(1, `BusFactor score: ${score}, Latency: ${latency} ms`);
            return { score, latency };
        });
    }
}
exports.BusFactorMetric = BusFactorMetric;
