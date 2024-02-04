import { LogLevel as PeerLogLevel } from "peerjs";

type ConfigMode = "development" | "production" | "test";
type ConfigLogLevel = PeerLogLevel;
type ConfigServer = {
  host: string;
  port: number;
  socketsPath: string;
  logLevel: ConfigLogLevel;
  secure: boolean;
};

class Config {
  private mode: ConfigMode;
  private server: ConfigServer;

  constructor() {
    this.mode = process.env.NODE_ENV;
    this.server = {
      host: process.env.REACT_APP_SERVER_HOST || "",
      port: parseInt(process.env.REACT_APP_SERVER_PORT || ""),
      socketsPath: "/sockets",
      logLevel: parseInt(
        process.env.REACT_APP_SERVER_DEBUG || PeerLogLevel.Disabled.toString()
      ) as ConfigLogLevel,
      secure: process.env.REACT_APP_SERVER_SECURE === "true" ? true : false,
    };
  }

  get = (): { mode: ConfigMode; server: ConfigServer } => ({
    mode: this.mode,
    server: { ...this.server },
  });
}

const config = new Config();
export default config;
