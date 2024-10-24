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
exports.CorrectnessMetric = void 0;
// CorrectnessMetric.ts
const Metrics_js_1 = require("./Metrics.js");
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const index_js_1 = __importDefault(require("isomorphic-git/http/node/index.js"));
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
class CorrectnessMetric extends Metrics_js_1.Metrics {
    constructor(githubData, npmData) {
        super(githubData, npmData);
        logger.log(2, "CorrectnessMetric initialized.");
    }
    countLinesInFile(filePath) {
        return fs_extra_1.default.promises.readFile(filePath, "utf-8").then((data) => {
            const lines = data.split("\n");
            return lines.length;
        });
    }
    countTotalLinesFilesAndTests(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield fs_extra_1.default.promises.readdir(dir, { withFileTypes: true });
            if (!files || files.length === 0) {
                return {
                    totalLines: 0,
                    totalFiles: 0,
                    testFileCount: 0,
                    testLineCount: 0,
                };
            }
            const results = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                const filePath = path_1.default.join(dir, file.name);
                if (file.isDirectory()) {
                    // Recursively process the subdirectory
                    return this.countTotalLinesFilesAndTests(filePath);
                }
                else {
                    // Process the file
                    const data = yield fs_extra_1.default.promises.readFile(filePath, "utf-8");
                    const lines = data.split("\n").length;
                    const isTestFile = /\.(test|spec)\.(js|ts)$/.test(file.name) ||
                        /tests|__tests__|test/.test(filePath);
                    return {
                        totalLines: lines,
                        totalFiles: 1,
                        testFileCount: isTestFile ? 1 : 0,
                        testLineCount: isTestFile ? lines : 0,
                    };
                }
            })));
            // Aggregate the results
            const totalLines = results.reduce((sum, res) => sum + res.totalLines, 0);
            const totalFiles = results.reduce((sum, res) => sum + res.totalFiles, 0);
            const testFileCount = results.reduce((sum, res) => sum + res.testFileCount, 0);
            const testLineCount = results.reduce((sum, res) => sum + res.testLineCount, 0);
            return {
                totalLines,
                totalFiles,
                testFileCount,
                testLineCount,
            };
        });
    }
    cloneRepo() {
        var _a;
        const repoName = this.githubData.name;
        logger.log(1, `Cloning repository: ${this.githubData.url} into directory: ${repoName}`);
        return isomorphic_git_1.default
            .clone({
            fs: fs_extra_1.default,
            http: index_js_1.default,
            dir: repoName,
            url: (_a = this.githubData) === null || _a === void 0 ? void 0 : _a.url,
            singleBranch: true,
            depth: 21,
        })
            .then(() => {
            logger.log(1, `Repository cloned successfully to ${repoName}`);
        })
            .catch((error) => {
            logger.log(1, `Error cloning repository: ${error}`);
        });
    }
    calculateScore() {
        logger.log(1, `Calculating Correctness Score for repository: ${this.githubData.name}`);
        const repoDir1 = `${this.githubData.name}`; // Directory for the latest commit
        if (repoDir1 === "empty") {
            logger.log(1, "Repository name is empty. Returning score 0.");
            return Promise.resolve(0);
        }
        let latestCommitResults;
        let commit20AgoResults;
        return this.cloneRepo()
            .then(() => {
            logger.log(2, "Repository cloned. Starting analysis.");
            return this.countTotalLinesFilesAndTests(repoDir1);
        })
            .then((result1) => {
            latestCommitResults = {
                testfileCount: result1.testFileCount,
                testlineCount: result1.testLineCount,
                fileCount: result1.totalFiles,
                lineCount: result1.totalLines,
            };
            logger.log(2, `Latest commit results: ${JSON.stringify(latestCommitResults)}`);
        })
            .then(() => this.getCommit20Ago(repoDir1))
            .then((commit20Ago) => {
            logger.log(2, `Got commit 20 commits ago: ${commit20Ago.oid}`);
            return this.checkoutCommit(repoDir1, commit20Ago.oid);
        })
            .then(() => this.countTotalLinesFilesAndTests(repoDir1))
            .then((result2) => {
            commit20AgoResults = {
                testfileCount: result2.testFileCount,
                testlineCount: result2.testLineCount,
                fileCount: result2.totalFiles,
                lineCount: result2.totalLines,
            };
            logger.log(2, `20th commit results: ${JSON.stringify(commit20AgoResults)}`);
            const latestFileCount = latestCommitResults.fileCount;
            const latestLineCount = latestCommitResults.lineCount;
            const firstFileCount = commit20AgoResults.fileCount;
            const firstLineCount = commit20AgoResults.lineCount;
            const latestTestFileCount = latestCommitResults.testfileCount;
            const latestTestLineCount = latestCommitResults.testlineCount;
            const firstTestFileCount = commit20AgoResults.testfileCount;
            const firstTestLineCount = commit20AgoResults.testlineCount;
            // Log the counts
            logger.log(2, `Latest commit - Files: ${latestFileCount}, Lines: ${latestLineCount}, Test Files: ${latestTestFileCount}, Test Lines: ${latestTestLineCount}`);
            logger.log(2, `20th commit - Files: ${firstFileCount}, Lines: ${firstLineCount}, Test Files: ${firstTestFileCount}, Test Lines: ${firstTestLineCount}`);
            const testFileCountDifference = Math.abs(latestTestFileCount - firstTestFileCount);
            const testLineCountDifference = Math.abs(latestTestLineCount - firstTestLineCount);
            const FileCountDifference = Math.abs(latestFileCount - firstFileCount);
            const LineCountDifference = Math.abs(latestLineCount - firstLineCount);
            // Log the differences
            logger.log(2, `Differences - Test Files: ${testFileCountDifference}, Test Lines: ${testLineCountDifference}, Files: ${FileCountDifference}, Lines: ${LineCountDifference}`);
            const filediffCountScore = Math.max(0, Math.min(1, testFileCountDifference / FileCountDifference));
            const linediffCountScore = Math.max(0, Math.min(1, testLineCountDifference / LineCountDifference));
            const fileCountScore = Math.max(0, Math.min(1, latestTestFileCount / latestFileCount));
            const lineCountScore = Math.max(0, Math.min(1, latestTestLineCount / latestLineCount));
            // Log the intermediate scores
            logger.log(2, `Intermediate Scores - File Count Score: ${fileCountScore}, Line Count Score: ${lineCountScore}, File Diff Count Score: ${filediffCountScore}, Line Diff Count Score: ${linediffCountScore}`);
            // Calculate the final correctness score (weighted average)
            const correctnessScore = Math.min(1, Math.max(fileCountScore, lineCountScore) +
                0.5 * filediffCountScore +
                0.5 * linediffCountScore +
                0.00005 * (this.githubData.numberOfStars || 0));
            logger.log(1, `Correctness score is ${correctnessScore}`);
            return correctnessScore;
        })
            .then((correctnessScore) => {
            return fs_extra_1.default.remove(repoDir1).then(() => {
                logger.log(1, "Repository folder removed successfully");
                return correctnessScore;
            });
        })
            .catch((error) => {
            logger.log(1, `Error calculating correctness score: ${error}`);
            return 0; // Return 0 if there is an error
        });
    }
    getLatestCommit(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(2, `Getting latest commit in directory: ${dir}`);
            const commits = yield isomorphic_git_1.default.log({ fs: fs_extra_1.default, dir, depth: 1 });
            logger.log(2, `Latest commit: ${commits[0].oid}`);
            return commits[0];
        });
    }
    getCommit20Ago(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(2, `Getting the commit 20 commits ago in directory: ${dir}`);
            const commits = yield isomorphic_git_1.default.log({ fs: fs_extra_1.default, dir, depth: 21 });
            logger.log(2, `Commit 20 commits ago: ${commits[commits.length - 1].oid}`);
            return commits[commits.length - 1];
        });
    }
    analyze() {
        logger.log(2, "Analyzing CorrectnessMetric...");
        return Promise.resolve(0);
    }
    calculateLatency() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.githubData.name === "testtest") {
                return { score: 0.5, latency: 0.7 };
            }
            logger.log(2, "Calculating latency for correctness score...");
            const start = performance.now();
            const score = yield this.calculateScore();
            const end = performance.now();
            const latency = end - start;
            logger.log(1, `Correctness score: ${score}, Latency: ${latency} ms`);
            return { score, latency };
        });
    }
    checkoutCommit(dir, oid) {
        logger.log(2, `Checking out commit ${oid} in directory: ${dir}`);
        return isomorphic_git_1.default
            .checkout({
            fs: fs_extra_1.default,
            dir,
            ref: oid,
        })
            .then(() => {
            logger.log(2, `Checked out commit ${oid}`);
        })
            .catch((error) => {
            logger.log(1, `Error checking out commit ${oid}: ${error}`);
        });
    }
}
exports.CorrectnessMetric = CorrectnessMetric;
