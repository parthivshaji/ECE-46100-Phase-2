"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubData = void 0;
const logger_js_1 = require("./logger.js");
class GitHubData {
    constructor(url = "empty", name = "empty", numberOfClosedIssues = 0, numberOfCommits = 0, numberOfForks = 0, numberOfStars = 0, numberOfCollaborators = 0, readme = false, description = false, contributions = [], license = "empty", Closed_Issues = [], size = 0, openIssues = [], latency = 0) {
        this.name = name;
        this.numberOfclosedIssues = numberOfClosedIssues;
        this.numberOfCommits = numberOfCommits;
        this.numberOfForks = numberOfForks;
        this.numberOfStars = numberOfStars;
        this.numberOfCollaborators = numberOfCollaborators;
        this.readme = readme;
        this.description = description;
        this.contributions = contributions;
        this.license = license;
        this.Closed_Issues = Closed_Issues;
        this.url = url;
        this.size = size;
        this.openIssues = openIssues;
        this.latency = latency;
    }
    printMyData() {
        const logger = new logger_js_1.Logger();
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Forks: ${this.name !== "empty"
            ? this.numberOfForks : "N/A"}`);
        logger.log(2, `Number of Stars: ${this.name !== "empty"
            ? this.numberOfStars : "N/A"}`);
        logger.log(2, "GitHub Data:");
        logger.log(2, `Name: ${this.name}`);
        logger.log(2, `License Name: ${this.name !== "empty" ? this.
            license : "N/A"} `);
        if (this.contributions)
            logger.log(2, `Contributions Array: ${this.contributions.length > 0 ?
                this.contributions[0].commits : "N/A"}`);
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Issues: ${this.name !== "empty" ?
            this.numberOfclosedIssues : "N/A"}`);
    }
}
exports.GitHubData = GitHubData;
