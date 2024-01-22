const appName = "PrivacyPeer:";

export class Logger {
  static warning = (...args: any[]) => console.warn(appName, ...args);
  static info = (...args: any[]) => console.info(appName, ...args);
  static error = (...args: any[]) => console.error(appName, ...args);
  static debug = (...args: any[]) => console.debug(appName, ...args);
}

export class FetchLogger {
  private msg: string;
  constructor(msg: string) {
    this.msg = msg;
  }

  start = (msg?: any) => Logger.info("START:", this.msg, msg);
  success = (msg?: any) => Logger.info("SUCCESS:", this.msg, msg);
  error = (msg?: any) => Logger.error("ERROR:", this.msg, msg);
}
