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
exports.LicenseMetric = void 0;
// LicenseMetric.ts
const Metrics_js_1 = require("./Metrics.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class LicenseMetric extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
        this.compatibleLicenses = [
            // GNU General Public License v2
            "GNU General Public License v2 (GPL-2.0)",
            "GPL-2.0",
            "GPL 2.0",
            "GPLv2",
            "GNU GPL v2",
            "GNU GPL 2.0",
            // GNU General Public License v3
            "GNU General Public License v3 (GPL-3.0)",
            "GPL-3.0",
            "GPL 3.0",
            "GPLv3",
            "GNU GPL v3",
            "GNU GPL 3.0",
            // MIT License
            "MIT",
            "MIT License",
            "Massachusetts Institute of Technology License",
            // BSD License (2-Clause)
            "BSD License (2-Clause)",
            "BSD 2-Clause",
            "BSD-2-Clause",
            "BSD Simplified License",
            "BSD FreeBSD License",
            // BSD License (3-Clause)
            "BSD License (3-Clause)",
            "BSD 3-Clause",
            "BSD-3-Clause",
            "New BSD License",
            "BSD Modified License",
            // Apache License 1.1
            "Apache License 1.1",
            "Apache 1.1",
            "Apache License, Version 1.1",
            // Zlib License
            "Zlib License",
            "zlib/libpng License",
            "zlib",
            // X11 License
            "X11 License",
            "MIT/X11 License",
            "X11",
            "X11-style License",
            // Public Domain
            "Public Domain",
            "Unlicense",
            "CC0"
        ];
        this.partialCompatibility = [
            // Mozilla Public License 2.0
            "Mozilla Public License 2.0",
            "MPL 2.0",
            "MPL-2.0",
            // GNU Lesser General Public License (LGPL)
            "GNU Lesser General Public License (LGPL)",
            "LGPL",
            "LGPL-2.1",
            "LGPL-3.0",
            "Lesser General Public License",
            "GNU LGPL 2.1",
            "GNU LGPL 3.0",
            // Eclipse Public License
            "Eclipse Public License",
            "EPL",
            "EPL-1.0",
            "EPL-2.0",
            // Creative Commons Attribution License
            "Creative Commons Attribution License",
            "CC Attribution 4.0",
            "CC-BY 4.0",
            "CC-BY",
            "CC Attribution",
            "CC-BY 3.0"
        ];
        logger.log(1, "LicenseMetric instance created.");
    }
    calculateScore() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Calculating license compatibility score...");
            let repoLicense = (_a = this.githubData.license) !== null && _a !== void 0 ? _a : "";
            logger.log(1, `Initial GitHub license: ${repoLicense}`);
            // If the GitHub license is not in compatibleLicenses or partialCompatibility,
            // assign the NPM license
            if (!this.compatibleLicenses.includes(repoLicense) &&
                !this.partialCompatibility.includes(repoLicense)) {
                repoLicense = (_b = this.npmData.license) !== null && _b !== void 0 ? _b : "";
                logger.log(1, `GitHub license not compatible; using NPM license: ${repoLicense}`);
            }
            // Full compatibility check
            if (this.compatibleLicenses.includes(repoLicense)) {
                logger.log(1, `License ${repoLicense} is fully compatible.`);
                return 1; // Fully compatible
            }
            // Partial compatibility check
            if (this.partialCompatibility.includes(repoLicense)) {
                logger.log(1, `License ${repoLicense} is partially compatible.`);
                return 0.5; // Return partial score
            }
            logger.log(1, `License ${repoLicense} is incompatible.`);
            return 0; // Incompatible
        });
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "Calculating latency for license score calculation...");
            const start = performance.now();
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(1, `Calculated score: ${score}, Latency: ${latency} ms`);
            return { score, latency };
        });
    }
}
exports.LicenseMetric = LicenseMetric;
