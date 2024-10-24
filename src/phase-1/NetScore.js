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
exports.NetScore = void 0;
const RampUpMetric_js_1 = require("./RampUpMetric.js");
const CorrectnessMetric_js_1 = require("./CorrectnessMetric.js");
const BusFactorMetric_js_1 = require("./BusFactorMetric.js");
const ResponsivenessMetric_js_1 = require("./ResponsivenessMetric.js");
const LicenseMetric_js_1 = require("./LicenseMetric.js");
const Metrics_js_1 = require("./Metrics.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class NetScore extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
        // New attribute to store metric results
        this.metrics = null;
        logger.log(1, "NetScore instance created.");
        this.correctnessMetric = new CorrectnessMetric_js_1.CorrectnessMetric(githubData, npmData);
        this.responsivenessMetric = new ResponsivenessMetric_js_1.ResponsivenessMetric(githubData, npmData);
        this.rampUpMetric = new RampUpMetric_js_1.RampUpMetric(githubData, npmData);
        this.busFactorMetric = new BusFactorMetric_js_1.BusFactorMetric(githubData, npmData);
        this.licenseMetric = new LicenseMetric_js_1.LicenseMetric(githubData, npmData);
    }
    // Method to calculate and store metric results
    calculateScore() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Calculating NetScore...");
            // Calculate all metrics in parallel using Promise.all
            const metricResults = yield Promise.all([
                this.correctnessMetric.calculateLatency(),
                this.responsivenessMetric.calculateLatency(),
                this.rampUpMetric.calculateLatency(),
                this.busFactorMetric.calculateLatency(),
                this.licenseMetric.calculateLatency()
            ]);
            const [correctness, responsiveness, rampUp, busFactor, license] = metricResults;
            logger.log(2, `Correctness score: ${correctness.score}, latency: ${correctness.latency}`);
            logger.log(2, `Responsiveness score: ${responsiveness.score}, latency: ${responsiveness.latency}`);
            logger.log(2, `RampUp score: ${rampUp.score}, latency: ${rampUp.latency}`);
            logger.log(2, `BusFactor score: ${busFactor.score}, latency: ${busFactor.latency}`);
            logger.log(2, `License score: ${license.score}, latency: ${license.latency}`);
            // Store the results in the class attribute
            this.metrics = metricResults;
            // Calculate NetScore based on the stored metric results
            const netScore = (1 / 11) * rampUp.score +
                (1 / 11) * correctness.score +
                (1 / 11) * busFactor.score +
                (5 / 11) * responsiveness.score +
                (3 / 11) * license.score;
            logger.log(1, `Calculated NetScore: ${netScore}`);
            return netScore;
        });
    }
    getMetricResults() {
        logger.log(2, "Returning stored metric results.");
        return this.metrics;
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Calculating latency for NetScore calculation...");
            const start = performance.now();
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(1, `NetScore: ${score}, Latency: ${latency} ms`);
            return { score, latency };
        });
    }
}
exports.NetScore = NetScore;
