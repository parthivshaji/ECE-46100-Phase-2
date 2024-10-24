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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
// CLI.ts
/* eslint-disable no-useless-escape */
const fs_1 = require("fs");
const GitHubAPI_js_1 = require("./GitHubAPI.js");
const NpmAPI_js_1 = require("./NpmAPI.js");
const GitHubData_js_1 = require("./GitHubData.js");
const NPMData_js_1 = require("./NPMData.js");
const logger_js_1 = require("./logger.js");
const promises_1 = __importDefault(require("fs/promises"));
const NetScore_js_1 = require("./NetScore.js");
const logger = new logger_js_1.Logger();
class CLI {
    testSuites() {
        logger.log(1, "Starting test suites...");
        // reading the raw test-results file
        const rawData = (0, fs_1.readFileSync)("testResults.json", "utf-8");
        // filtering out non-JSON lines and keep only the relevant ones
        const cleanedData = rawData.split("\n").filter(line => {
            // keeping lines that start with '{' or end with '}', which are parts of the JSON data
            return line.trim().startsWith("{") || line.trim().endsWith("}");
        }).join("\n");
        // writing the cleaned data into a new file without parsing
        (0, fs_1.writeFileSync)("cleanTestResults.json", cleanedData);
        // reading cleanTestResults.json and coverage-summary.json files
        const testResults = JSON.parse((0, fs_1.readFileSync)("cleanTestResults.json", "utf-8"));
        const coverageSummary = JSON.parse((0, fs_1.readFileSync)("coverage/coverage-summary.json", "utf-8"));
        // extracting test summary
        const totalTests = testResults.numTotalTests;
        const passedTests = testResults.numPassedTests;
        // extracting coverage summary
        const lineCoverage = coverageSummary.total.lines.pct;
        // calculating coverage percentage
        const coveragePercentage = Math.round(lineCoverage); // Percentage of lines covered
        //console.log(
        //`${passedTests}/${totalTests} test cases passed. ${coveragePercentage}% line coverage achieved.`); 
        console.log(`${passedTests}/${totalTests} test cases passed. ${coveragePercentage}% line coverage achieved.`);
        logger.log(1, "Test suites completed.");
    }
    readFromFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(2, `Attempting to read from file: ${path}`);
            try {
                const data = yield promises_1.default.readFile(path, "utf8");
                const urls = data.split("\n").map((v) => v.trim());
                if (urls[urls.length - 1] === "" || urls[urls.length - 1].length <= 2) {
                    urls.pop();
                }
                logger.log(2, `Successfully read ${urls.length} URLs from file.`);
                return urls;
            }
            catch (err) {
                logger.log(1, `Error reading from file ${path}: ${err}`);
                return [];
            }
        });
    }
    rankModules(path) {
        logger.log(1, `Starting to rank modules from path: ${path}`);
        this.rankModulesTogether(path)
            .then((results) => __awaiter(this, void 0, void 0, function* () {
            logger.log(1, "The data fetched for each URL:");
            const urls = yield this.readFromFile(path);
            // Loop through results and process each module
            for (const [index, { npmData, githubData }] of results.entries()) {
                logger.log(1, `Processing result ${index + 1}:`);
                if (npmData) {
                    npmData.printMyData();
                }
                if (githubData) {
                    githubData.printMyData();
                }
                if (githubData && npmData) {
                    const netScoreClass = new NetScore_js_1.NetScore(githubData, npmData);
                    const net = yield netScoreClass.calculateLatency();
                    const metrics = netScoreClass.getMetricResults();
                    if (metrics) {
                        const [correctness, responsiveness, rampUp, busFactor, license] = metrics;
                        const formattedResult = {
                            URL: urls[index],
                            NetScore: Number(net.score.toFixed(3)),
                            NetScore_Latency: Number((net.latency / 1000).toFixed(3)),
                            RampUp: Number(rampUp.score.toFixed(3)),
                            RampUp_Latency: Number((rampUp.latency / 1000).toFixed(3)),
                            Correctness: Number(correctness.score.toFixed(3)),
                            Correctness_Latency: Number((correctness.latency / 1000).toFixed(3)),
                            BusFactor: Number(busFactor.score.toFixed(3)),
                            BusFactor_Latency: Number((busFactor.latency / 1000).toFixed(3)),
                            ResponsiveMaintainer: Number(responsiveness.score.toFixed(3)),
                            ResponsiveMaintainer_Latency: Number((responsiveness.latency / 1000).toFixed(3)),
                            License: Number(license.score.toFixed(3)),
                            License_Latency: Number((license.latency / 1000).toFixed(3)) // Convert to number
                        };
                        if (githubData.name !== "empty") {
                            console.log(JSON.stringify(formattedResult));
                        }
                        else {
                            console.log({ URL: urls[index], error: "GitHub repo doesn't exist" });
                        }
                    }
                }
            }
        }))
            .catch((error) => {
            logger.log(1, `Error in rankModules: ${error}`);
        });
    }
    rankModulesTogether(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const urls = yield this.readFromFile(path);
                const promisesArray = [];
                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i];
                    let gitUrl = "empty";
                    let npmUrl = "empty";
                    if (url[8] === "g") {
                        gitUrl = url;
                    }
                    else {
                        npmUrl = url;
                    }
                    const data = this.fetchBothData(npmUrl, gitUrl);
                    promisesArray.push(data);
                }
                const results = yield Promise.all(promisesArray);
                return results;
            }
            catch (err) {
                logger.log(1, `Error in rankModulesTogether: ${err}`);
                return [];
            }
        });
    }
    fetchBothData(npmUrl, githubUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            let npmData = new NPMData_js_1.NPMData();
            let githubData = new GitHubData_js_1.GitHubData();
            if (githubUrl !== "empty") {
                const githubObject = this.parseGitHubUrl(githubUrl);
                const gitHubAPI = new GitHubAPI_js_1.GitHubAPI(githubObject.username, githubObject.repoName);
                githubData = yield gitHubAPI.fetchData();
                return { npmData, githubData };
            }
            else {
                const npmObject = this.parseNpmPackageUrl(npmUrl);
                const npmAPI = new NpmAPI_js_1.NpmAPI(npmObject);
                npmData = yield npmAPI.fetchData();
                //a
                if (npmData.githubUrl && npmData.githubUrl !== "empty") {
                    const githubObject = this.parseGitHubUrl(npmData.githubUrl);
                    const gitHubAPI = new GitHubAPI_js_1.GitHubAPI(githubObject.username, githubObject.repoName);
                    githubData = yield gitHubAPI.fetchData();
                }
                return { npmData, githubData };
            }
        });
    }
    parseGitHubUrl(url) {
        const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        // Apply the regex to the provided URL
        const match = url.match(regex);
        if (match) {
            // Extract username and repository name from the match
            const [, username, repoName] = match;
            return { username, repoName };
        }
        else {
            // Return empty values if the URL does not match the expected pattern
            return { username: "empty", repoName: "empty" };
        }
    }
    parseNpmPackageUrl(url) {
        const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        // Apply the regex to the provided URL
        const match = url.match(regex);
        // If a match is found, return the package name, otherwise return "empty"
        if (match) {
            const packageName = match[1];
            return packageName;
        }
        else {
            return "empty";
        }
    }
}
exports.CLI = CLI;
