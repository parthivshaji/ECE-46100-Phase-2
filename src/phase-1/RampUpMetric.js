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
exports.RampUpMetric = void 0;
const Metrics_js_1 = require("./Metrics.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class RampUpMetric extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
    }
    calculateScore() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Calculating RampUp Score...");
            const readmeScore = this.calculateReadmeDescription();
            logger.log(1, `README Description Score: ${readmeScore}`);
            const forksStarsScore = this.calculateForksStarsPercentage();
            logger.log(1, `Forks and Stars Percentage Score: ${forksStarsScore}`);
            const sizeProportionScore = this.calculateSizeProportion();
            logger.log(1, `Repository Size Proportion Score: ${sizeProportionScore}`);
            const issuesScore = this.calculateOpentoClosedIssueRatio();
            logger.log(1, `Open to Closed Issue Ratio Score: ${issuesScore}`);
            const contributorsScore = this.calculateContributors();
            logger.log(1, `Contributors Score: ${contributorsScore}`);
            const RampUp = readmeScore +
                forksStarsScore +
                sizeProportionScore +
                issuesScore +
                contributorsScore;
            logger.log(1, `Total RampUp Score: ${RampUp}`);
            return RampUp;
        });
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Measuring latency for score calculation...");
            const start = performance.now();
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(1, `Score Calculation Latency: ${latency} ms`);
            return { score, latency };
        });
    }
    calculateForksStarsPercentage() {
        var _a, _b;
        const forks = (_a = this.githubData.numberOfForks) !== null && _a !== void 0 ? _a : 0;
        const stars = (_b = this.githubData.numberOfStars) !== null && _b !== void 0 ? _b : 0;
        const totalForksStars = forks + stars;
        logger.log(1, `Total Forks: ${forks}, Total Stars: ${stars}, Total Forks + Stars: ${totalForksStars}`);
        let score = 0;
        if (totalForksStars >= 1000) {
            score = 0.1;
        }
        else {
            score = 0.1 * (totalForksStars / 1000);
        }
        logger.log(1, `Forks and Stars Percentage Score: ${score}`);
        return score;
    }
    calculateReadmeDescription() {
        const hasReadme = !!this.githubData.readme;
        const hasDescription = !!this.githubData.description;
        logger.log(1, `Has README: ${hasReadme}, Has Description: ${hasDescription}`);
        if (hasReadme && hasDescription) {
            return 0.2;
        }
        else if (hasReadme || hasDescription) {
            return 0.1;
        }
        return 0;
    }
    calculateSizeProportion() {
        var _a;
        const repoSizeKB = ((_a = this.githubData.size) !== null && _a !== void 0 ? _a : 0) / 1000;
        logger.log(1, `Repository Size (KB): ${repoSizeKB}`);
        return this.continuousScore(repoSizeKB);
    }
    continuousScore(x) {
        // Generates a score using a continuous function, scales size proportion
        return (0.35 / (x + 10)) + 0.05;
    }
    calculateOpentoClosedIssueRatio() {
        var _a, _b, _c, _d;
        const openIssues = (_b = (_a = this.githubData.openIssues) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        const closedIssues = (_d = (_c = this.githubData.Closed_Issues) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0;
        logger.log(1, `Open Issues: ${openIssues}, Closed Issues: ${closedIssues}`);
        if (closedIssues > openIssues) {
            return 0.2;
        }
        const issueRatio = (closedIssues / (openIssues + 1)) * 0.2; // Avoid division by 0
        logger.log(1, `Open to Closed Issue Ratio Score: ${issueRatio}`);
        return issueRatio;
    }
    calculateContributors() {
        var _a, _b, _c;
        const contributors = (_b = (_a = this.githubData.contributions) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        const repoSizeKB = ((_c = this.githubData.size) !== null && _c !== void 0 ? _c : 0) / 1000;
        // Scale the contributors score using a normalized logistic function
        const standardNoOfContributors = this.contributorScalingNormalized(repoSizeKB);
        logger.log(1, `Contributors: ${contributors}, Standard No. of Contributors (Normalized): ${standardNoOfContributors}`);
        // Scale the contributors to a maximum score of 0.1
        const score = Math.min(0.1, (contributors / standardNoOfContributors) * 0.1);
        logger.log(1, `Contributors Score: ${score}`);
        return score;
    }
    contributorScalingNormalized(repoSizeKB) {
        // Normalized logistic function to scale the expected number of contributors between 0 and 1
        return 1 / (1 + Math.exp(-0.1 * (repoSizeKB - 50)));
    }
}
exports.RampUpMetric = RampUpMetric;
