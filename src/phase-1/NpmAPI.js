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
exports.NpmAPI = void 0;
const API_js_1 = require("./API.js");
const NPMData_js_1 = require("./NPMData.js");
class NpmAPI extends API_js_1.API {
    constructor(packageName) {
        super();
        this.packageName = packageName;
        this.logger.log(1, `NpmAPI instance created for package: ${this.packageName}`);
    }
    fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://registry.npmjs.org/${this.packageName}`;
            const start = performance.now();
            try {
                this.logger.log(1, "Fetching data from NPM");
                this.logger.log(2, `Fetching data for package: ${this.packageName}`);
                const response = yield fetch(url);
                const data = yield response.json();
                const end = performance.now();
                const latency = end - start;
                this.logger.log(1, `Data fetched successfully in ${latency} ms`);
                const latestVersion = data["dist-tags"].latest;
                const versionData = data.versions[latestVersion];
                this.logger.log(2, `Latest version: ${latestVersion}`);
                const license = versionData === null || versionData === void 0 ? void 0 : versionData.license;
                const repository = versionData === null || versionData === void 0 ? void 0 : versionData.repository;
                const repoUrl = repository === null || repository === void 0 ? void 0 : repository.url;
                this.logger.log(2, `License: ${license}, Repository URL: ${repoUrl}`);
                let extractedUrl = repoUrl.slice(4, -4);
                if (!extractedUrl.startsWith("https") && extractedUrl.length !== 0) {
                    extractedUrl = `https:${extractedUrl}`;
                    this.logger.log(2, `Extracted and formatted repository URL: ${extractedUrl}`);
                    return new NPMData_js_1.NPMData(license, extractedUrl, latency);
                }
                else {
                    this.logger.log(2, `Extracted repository URL: ${extractedUrl}`);
                    return new NPMData_js_1.NPMData(license, extractedUrl, latency);
                }
            }
            catch (error) {
                this.logger.log(1, `Error fetching data: ${error}`);
                return new NPMData_js_1.NPMData();
            }
        });
    }
}
exports.NpmAPI = NpmAPI;
