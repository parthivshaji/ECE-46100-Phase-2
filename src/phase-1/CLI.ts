// CLI.ts
/* eslint-disable no-useless-escape */
import { readFileSync, writeFileSync } from "fs";
import { GitHubAPI } from "./GitHubAPI.js";
import { NpmAPI } from "./NpmAPI.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";
import fs from "fs/promises";
import { NetScore } from "./NetScore.js";
import { CodeReviewMetric } from "./CodeReviewMetric.js";

const logger = new Logger();

export class CLI {
  public testSuites(): void {
    logger.log(1, "Starting test suites...");
    // reading the raw test-results file
    const rawData = readFileSync("testResults.json", "utf-8");

    // filtering out non-JSON lines and keep only the relevant ones
    const cleanedData = rawData.split("\n").filter(line => {
        // keeping lines that start with '{' or end with '}', which are parts of the JSON data
        return line.trim().startsWith("{") || line.trim().endsWith("}");
    }).join("\n");

    // writing the cleaned data into a new file without parsing
    writeFileSync("cleanTestResults.json", cleanedData);
    
    // reading cleanTestResults.json and coverage-summary.json files
    const testResults = JSON.parse(readFileSync("cleanTestResults.json", "utf-8"));
    const coverageSummary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf-8"));

    // extracting test summary
    const totalTests = testResults.numTotalTests;
    const passedTests = testResults.numPassedTests;

    // extracting coverage summary
    const lineCoverage = coverageSummary.total.lines.pct;

    // calculating coverage percentage
   const coveragePercentage = Math.round(lineCoverage); // Percentage of lines covered

    //console.log(
    //`${passedTests}/${totalTests} test cases passed. ${coveragePercentage}% line coverage achieved.`); 
    
    console.log(
      `${passedTests}/${totalTests} test cases passed. ${coveragePercentage}% line coverage achieved.`); 
    
    
    logger.log(1, "Test suites completed.");
  }
  private async readFromFile(path: string): Promise<Array<string>> {
    logger.log(2, `Attempting to read from file: ${path}`);
    try {
      const data = await fs.readFile(path, "utf8");

      const urls: Array<string> = data.split("\n").map((v) => v.trim());
      if(urls[urls.length-1]===""||urls[urls.length-1].length<=2){

        urls.pop();
      }
      logger.log(2, `Successfully read ${urls.length} URLs from file.`);
      return urls;
    } catch (err) {
      logger.log(1, `Error reading from file ${path}: ${err}`);
      return [];
    }
  }

   private calculateDependencyPinningMetric(dependencies: Record<string, string>): number {
    if (!dependencies || Object.keys(dependencies).length === 0) {
      return 1.0; // Score 1.0 if there are no dependencies
    }

    let pinnedCount = 0;
    let totalDependencies = 0;

    for (const [_, version] of Object.entries(dependencies)) {
      if (typeof version === "string") {
        // Check if the dependency is pinned to a major+minor version
        if (/^\d+\.\d+\.\d+$|^\d+\.\d+\.x$|^~\d+\.\d+\.\d+$/.test(version)) {
          pinnedCount++;
        }
      }
      totalDependencies++;
    }

    const pinningScore = pinnedCount / totalDependencies;
    logger.log(2, `Dependency Pinning Score: ${pinningScore}`);
    return pinningScore;
  }


  public async rankModules(path: string): Promise<number> {
    logger.log(1, `Starting to rank modules from path: ${path}`);

    try {
        const results = await this.rankModulesTogether(path);
        logger.log(1, "The data fetched for each URL:");

        const urls = await this.readFromFile(path);

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
                const netScoreClass = new NetScore(githubData, npmData);
                const net = await netScoreClass.calculateLatency();
                const metrics = netScoreClass.getMetricResults();

                if (metrics) {
                    const [correctness, responsiveness, rampUp, busFactor, license, dependencyPinning, codeReviewMetric] = metrics;

                    const formattedResult = {
                        URL: urls[index],
                        NetScore: Number(net.score.toFixed(3)),
                        NetScore_Latency: Number((net.latency / 1000).toFixed(3)), // Convert to number
                        RampUp: Number(rampUp.score.toFixed(3)),
                        RampUp_Latency: Number((rampUp.latency / 1000).toFixed(3)), // Convert to number
                        Correctness: Number(correctness.score.toFixed(3)),
                        Correctness_Latency: Number((correctness.latency / 1000).toFixed(3)), // Convert to number
                        BusFactor: Number(busFactor.score.toFixed(3)),
                        BusFactor_Latency: Number((busFactor.latency / 1000).toFixed(3)), // Convert to number
                        ResponsiveMaintainer: Number(responsiveness.score.toFixed(3)),
                        ResponsiveMaintainer_Latency: Number((responsiveness.latency / 1000).toFixed(3)), // Convert to number
                        License: Number(license.score.toFixed(3)),
                        License_Latency: Number((license.latency / 1000).toFixed(3)), // Convert to number
                        CodeReviewFraction: Number(codeReviewMetric.score.toFixed(3)),
                        CodeReviewFraction_Latency: Number((codeReviewMetric.latency / 1000).toFixed(3)),
                        DependencyPinning: Number(dependencyPinning.score.toFixed(3)), // New metric
                        DependencyPinning_Latency: Number((dependencyPinning.latency / 1000).toFixed(3)), // New metric
                    };

                    if (githubData.name !== "empty") {
                        console.log(JSON.stringify(formattedResult));
                    } else {
                        console.log({
                            URL: urls[index],
                            error: "GitHub repo doesn't exist"
                        });
                    }
                }
            }
        }

        // Return success code 0 wrapped in a Promise
        return Promise.resolve(0);

    } catch (error) {
        logger.log(1, `Error in rankModules: ${error}`);
        // Return error code 1 wrapped in a Promise
        return Promise.resolve(1);
    }
}

  public async rankModules_phase2(path: string): Promise<string> {
    logger.log(1, `Starting to rank modules from path: ${path}`);

    try {
        const results = await this.rankModulesTogether(path);
        logger.log(1, "The data fetched for each URL:");

        const urls = await this.readFromFile(path);

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
                const netScoreClass = new NetScore(githubData, npmData);
                const net = await netScoreClass.calculateLatency();
                const metrics = netScoreClass.getMetricResults();

                if (metrics) {
                    const [correctness, responsiveness, rampUp, busFactor, license, dependencyPinning, codeReviewMetric] = metrics;
                     
                    const formattedResult = {
                        NetScore: Number(net.score.toFixed(3)),
                        NetScoreLatency: Number((net.latency / 1000).toFixed(3)), // Convert to number
                        RampUp: Number(rampUp.score.toFixed(3)),
                        RampUpLatency: Number((rampUp.latency / 1000).toFixed(3)), // Convert to number
                        Correctness: Number(correctness.score.toFixed(3)),
                        CorrectnessLatency: Number((correctness.latency / 1000).toFixed(3)), // Convert to number
                        BusFactor: Number(busFactor.score.toFixed(3)),
                        BusFactorLatency: Number((busFactor.latency / 1000).toFixed(3)), // Convert to number
                        ResponsiveMaintainer: Number(responsiveness.score.toFixed(3)),
                        ResponsiveMaintainerLatency: Number((responsiveness.latency / 1000).toFixed(3)), // Convert to number
                        LicenseScore: Number(license.score.toFixed(3)),
                        LicenseScoreLatency: Number((license.latency / 999).toFixed(3)), // Convert to number
                        PullRequest: Number(codeReviewMetric.score.toFixed(3)),
                        PullRequestLatency: Number((codeReviewMetric.latency / 1000).toFixed(3)),
                        GoodPinningPractice: Number(dependencyPinning.score.toFixed(3)), // New metric
                        GoodPinningPracticeLatency: Number((dependencyPinning.latency / 1000).toFixed(3)), // New metric
                    };

                    if (githubData.name !== "empty") {
                        return (JSON.stringify(formattedResult));
                    } else {
                        return "GitHub repo doesn't exist";
                    }
                }
            }
        }

        // Return success code 0 wrapped in a Promise
        // return Promise.resolve(0);
        return "Error in rankModules"

    } catch (error) {
        logger.log(1, `Error in rankModules: ${error}`);
        // Return error code 1 wrapped in a Promise
        return "Error in rankModules: ${error}"
    }
}


  public async rankModulesTogether(
    path: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData}[]> {

    try {
      const urls = await this.readFromFile(path);

      const promisesArray = [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let gitUrl = "empty";
        let npmUrl = "empty";

        if (url[8] === "g") {
          gitUrl = url;
        } else {
          npmUrl = url;
        }
        const data = this.fetchBothData(npmUrl, gitUrl);
        promisesArray.push(data);
      }

      const results = await Promise.all(promisesArray);
      return results;
    } catch (err) {
      logger.log(1, `Error in rankModulesTogether: ${err}`);
      return [];
    }
  }

  public async fetchBothData(
    npmUrl: string,
    githubUrl: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData }> {

    let npmData = new NPMData();
    let githubData = new GitHubData();
    if (githubUrl !== "empty") {
      const githubObject = this.parseGitHubUrl(githubUrl);
      const gitHubAPI = new GitHubAPI(
        githubObject.username,
        githubObject.repoName
      );


      githubData = await gitHubAPI.fetchData();

      return { npmData, githubData };
    } else {
      const npmObject = this.parseNpmPackageUrl(npmUrl);

      const npmAPI = new NpmAPI(npmObject);

      npmData = await npmAPI.fetchData();

      if (npmData.githubUrl && npmData.githubUrl !== "empty") {
        const githubObject = this.parseGitHubUrl(npmData.githubUrl);

        const gitHubAPI = new GitHubAPI(
          githubObject.username,
          githubObject.repoName
        );
        githubData = await gitHubAPI.fetchData();
      } 
      return { npmData, githubData };
    }
  }

  private parseGitHubUrl(url: string): { username: string; repoName: string } {
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;

    // Apply the regex to the provided URL
    const match = url.match(regex);

    if (match) {
      // Extract username and repository name from the match
      const [, username, repoName] = match;
      return { username, repoName };
    } else {
      // Return empty values if the URL does not match the expected pattern
      return { username: "empty", repoName: "empty" };
    }
  }
  private parseNpmPackageUrl(url: string): string {
    const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

    // Apply the regex to the provided URL
    const match = url.match(regex);

    // If a match is found, return the package name, otherwise return "empty"
    if (match) {
      const packageName = match[1];
      return packageName;
    } else {
      return "empty";
    }
  }
}