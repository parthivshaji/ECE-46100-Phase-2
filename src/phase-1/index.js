"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CLI_js_1 = require("./CLI.js");
const logger_js_1 = require("./logger.js");
const logger = new logger_js_1.Logger();
const args = process.argv.slice(2);
const mode = args[0];
const cli = new CLI_js_1.CLI();
logger.log(1, "\n\n\n********************************************\n\n\n");
logger.log(2, `Script started with mode: ${mode}`);
switch (mode) {
    case "test":
        logger.log(1, "We are running the tests now.");
        cli.testSuites();
        logger.log(2, "Test suites execution finished.");
        break;
    default:
        {
            if (!process.env.LOG_FILE) {
                process.exit(1);
            }
            const start = performance.now();
            logger.log(1, "We are going to rank the modules now.");
            logger.log(2, `Rank modules is called with parameter = ${mode}`);
            cli.rankModules(mode);
            const end = performance.now();
            logger.log(2, `Total delay of fetching is ${end - start} ms.`);
            logger.log(1, "Ranking of modules completed.");
        }
        break;
}
logger.log(2, "Script execution finished.");
logger.log(1, "\n\n\n********************************************\n\n\n");
