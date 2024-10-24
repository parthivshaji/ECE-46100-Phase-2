import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class Logger {
  private logFilePath: string;
  private logLevel: number;

  constructor() {
    // Set a default log file path if the environment variable is not provided
    this.logFilePath = process.env.LOG_FILE || "logs/default-log-file.log";
    
    // Set a default log level (1: INFO, 2: DEBUG, default is 1: INFO)
    this.logLevel = this.getLogLevel();
    
    // Ensure that the log file directory and file exist
    this.ensureLogFileExists();
  }

  private getLogLevel(): number {
    // Parse log level from environment, default to 1 (INFO) if invalid
    const level = parseInt(process.env.LOG_LEVEL || "1", 10);
    
    // Return valid levels only (1: INFO, 2: DEBUG), default to 1
    return isNaN(level) || level < 1 || level > 2 ? 1 : level;
  }

  private ensureLogFileExists(): void {
    const dir = path.dirname(this.logFilePath);
    
    // Ensure the log directory exists, create if it doesn't
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Ensure the log file exists, create if it doesn't
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "", "utf-8");
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}]: ${message}\n`;
  }

  public log(level: number, message: string): void {
    if (level <= this.logLevel) {
      const levelString = this.getLevelString(level);
      const formattedMessage = this.formatMessage(levelString, message);
      
      // Append the log message to the log file
      fs.appendFileSync(this.logFilePath, formattedMessage, "utf-8");
    }
  }

  private getLevelString(level: number): string {
    switch (level) {
      case 1:
        return "INFO";
      case 2:
        return "DEBUG";
      default:
        return "SILENT";
    }
  }
}
