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
exports.GitHubAPI = void 0;
const octokit_1 = require("octokit");
const GitHubData_js_1 = require("./GitHubData.js");
const API_js_1 = require("./API.js");
class GitHubAPI extends API_js_1.API {
    constructor(owner, repoName) {
        super();
        this.owner = owner;
        this.repoName = repoName;
        this.logger.log(2, "GitHubAPI initialized for owner: " + this.owner + ", repo: " + this.repoName);
    }
    fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            const octokit = new octokit_1.Octokit({
                auth: process.env.GITHUB_TOKEN
            });
            const start = performance.now();
            try {
                this.logger.log(2, "Fetching data for owner: " + this.owner + ", repo: " + this.repoName);
                // Initialize API requests
                this.logger.log(2, "Initializing API requests.");
                const reposRequest = octokit.request("GET /repos/{owner}/{repo}", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    }
                });
                const commitsRequest = octokit.request("GET /repos/{owner}/{repo}/commits", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    }
                });
                // Fetch issues and contributors with pagination
                const issuesRequest = this.fetchIssues(octokit);
                const contributorsRequest = this.fetchContributors(octokit);
                const readmeRequest = octokit.request("GET /repos/{owner}/{repo}/readme", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    }
                });
                this.logger.log(2, "Awaiting responses from GitHub API requests.");
                // Wait for all data fetches to complete in parallel
                const [reposResponse, issuesResponse, commitsResponse, contributors, readmeResponse] = yield Promise.all([
                    reposRequest,
                    issuesRequest,
                    commitsRequest,
                    contributorsRequest,
                    readmeRequest.catch(() => null)
                ]);
                const closed_issues = issuesResponse.closedIssues;
                const openIssues = issuesResponse.openIssues;
                this.logger.log(2, "Fetched " + closed_issues.length + " closed issues and " + openIssues.length + " open issues.");
                // Process contributors data
                const totalContributions = contributors.map((contributor) => ({
                    contributor: contributor.login,
                    // totalLinesAdded: contributor.total,
                    commits: contributor.contributions
                }));
                this.logger.log(2, "Processed contributions from " + contributors.length + " contributors.");
                const readmeFound = !!readmeResponse;
                const descriptionFound = !!reposResponse.data.description;
                this.logger.log(2, "Readme found: " + readmeFound + ", Description found: " + descriptionFound);
                const license = reposResponse.data.license ? reposResponse.data.license.name : "empty";
                this.logger.log(2, "License: " + license);
                const end = performance.now();
                const latency = end - start;
                this.logger.log(2, "Data fetch latency: " + latency + " ms.");
                this.logger.log(2, "Successfully fetched data from GitHub API");
                return new GitHubData_js_1.GitHubData(this.generateRepoUrl(this.owner, this.repoName), reposResponse.data.name, closed_issues.length, commitsResponse.data.length, reposResponse.data.forks_count, reposResponse.data.stargazers_count, reposResponse.data.collaborators_url.length, readmeFound, descriptionFound, totalContributions, license, closed_issues, reposResponse.data.size, openIssues, latency);
            }
            catch (error) {
                this.logger.log(2, "Error fetching data: " + error + " for the repo " + this.repoName);
                return new GitHubData_js_1.GitHubData(); // Return empty data on error
            }
        });
    }
    // Fetch issues with pagination
    fetchIssues(octokit) {
        return __awaiter(this, void 0, void 0, function* () {
            const closedIssues = [];
            const openIssues = [];
            let page = 1;
            const perPage = 100;
            let moreIssues = true;
            const currentDate = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
            this.logger.log(2, "Fetching closed issues since " + threeMonthsAgo.toISOString());
            // Fetch closed issues
            while (moreIssues) {
                const issuesResponse = yield octokit.request("GET /repos/{owner}/{repo}/issues", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    page: page,
                    per_page: perPage,
                    state: "closed",
                    since: threeMonthsAgo.toISOString()
                });
                const fetchedIssues = issuesResponse.data;
                this.logger.log(2, "Fetched " + fetchedIssues.length + " closed issues on page " + page);
                if (fetchedIssues.length === 0) {
                    moreIssues = false;
                }
                else {
                    closedIssues.push(...fetchedIssues);
                    page++;
                }
            }
            this.logger.log(2, "Finished fetching closed issues. Total closed issues: " + closedIssues.length);
            // Reset page counter and fetch open issues
            page = 1;
            moreIssues = true;
            this.logger.log(2, "Fetching open issues since " + threeMonthsAgo.toISOString());
            while (moreIssues) {
                const issuesResponse = yield octokit.request("GET /repos/{owner}/{repo}/issues", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    page: page,
                    per_page: perPage,
                    state: "open",
                    since: threeMonthsAgo.toISOString()
                });
                const fetchedIssues = issuesResponse.data;
                this.logger.log(2, "Fetched " + fetchedIssues.length + " open issues on page " + page);
                if (fetchedIssues.length === 0) {
                    moreIssues = false;
                }
                else {
                    openIssues.push(...fetchedIssues);
                    page++;
                }
            }
            this.logger.log(2, "Finished fetching open issues. Total open issues: " + openIssues.length);
            // Return both closed and open issues
            this.logger.log(2, "Returning fetched issues.");
            return { closedIssues, openIssues };
        });
    }
    // Fetch contributors with pagination
    fetchContributors(octokit) {
        return __awaiter(this, void 0, void 0, function* () {
            const contributors = [];
            let page = 1;
            const perPage = 50;
            let moreContributors = true;
            this.logger.log(2, "Fetching contributors for repository: " + this.owner + "/" + this.repoName);
            while (moreContributors) {
                const contributorsResponse = yield octokit.request("GET /repos/{owner}/{repo}/contributors", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    page: page,
                    per_page: perPage
                });
                const fetchedContributors = contributorsResponse.data;
                this.logger.log(2, "Fetched " + fetchedContributors.length + " contributors on page " + page);
                if (fetchedContributors.length === 0) {
                    moreContributors = false;
                }
                else {
                    contributors.push(...fetchedContributors);
                    page++;
                }
            }
            this.logger.log(2, "Finished fetching contributors. Total contributors: " + contributors.length);
            this.logger.log(2, "Returning fetched contributors.");
            return contributors;
        });
    }
    generateRepoUrl(username, repoName) {
        this.logger.log(2, "Generating repository URL for username: " + username + ", repoName: " + repoName);
        // Ensure the username and repoName are trimmed and not empty
        if (!username.trim() || !repoName.trim()) {
            this.logger.log(1, "Username and repository name cannot be empty.");
            throw new Error("Username and repository name cannot be empty.");
        }
        // Construct the GitHub repository URL
        const repoUrl = `https://github.com/${username}/${repoName}`;
        this.logger.log(2, "Generated repository URL: " + repoUrl);
        return repoUrl;
    }
}
exports.GitHubAPI = GitHubAPI;
