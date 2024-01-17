export class Message {
  warning = (...args: any[]) => console.warn(...args);
  info = (...args: any[]) => console.info(...args);
  error = (...args: any[]) => console.error(...args);
}
