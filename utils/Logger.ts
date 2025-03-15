/**
 * ILogger interface defines the structure for the Logger class.
 * It includes methods to log messages, log errors, and enable or disable logging.
 */
export type ILogger = {
  status: boolean;

  /**
   * Log a general message if logging is enabled.
   * @param string - The message to log.
   */
  log: (string: string) => void;

  /**
   * Log an error message if logging is enabled.
   * @param reason - The error message or error object.
   */
  error: (reason: string | Error) => void;

  /**
   * Enable logging functionality.
   */
  enable: () => void;

  /**
   * Disable logging functionality.
   */
  disable: () => void;
};

/**
 * Logger class implements the ILogger interface.
 * It is responsible for logging messages and errors to the console.
 */
export class Logger implements ILogger {
  private readonly logger: Console;
  public status: boolean;

  /**
   * Constructor to initialize the Logger class with default values.
   * Sets up the logger to use the browser's console and disables logging initially.
   */
  constructor() {
    this.logger = console;
    this.status = false;
  }

  /**
   * Log a message to the console if logging is enabled.
   * @param string - The message to log.
   */
  log(string: string): void {
    if (this.status) this.logger.log(string);
  }

  /**
   * Log an error message to the console if logging is enabled.
   * @param reason - The error message or error object.
   */
  error(reason: string | Error): void {
    if (this.status) this.logger.error(reason);
  }

  /**
   * Enable logging functionality.
   */
  enable(): void {
    this.status = true;
  }

  /**
   * Disable logging functionality.
   */
  disable(): void {
    this.status = false;
  }
}
