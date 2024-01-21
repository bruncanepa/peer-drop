export class Message {
  warning = (...args: any[]) => console.warn("PrivacyPeer:", ...args);
  info = (...args: any[]) => console.info("PrivacyPeer:", ...args);
  error = (...args: any[]) => console.error("PrivacyPeer:", ...args);
  debug = (...args: any[]) => console.debug("PrivacyPeer:", ...args);
}
