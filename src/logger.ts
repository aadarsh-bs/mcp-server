import { pino } from "pino";

// 1. The actual logger instance, swapped out as needed
let currentLogger: any;

if (process.env.NODE_ENV === "development") {
  currentLogger = pino({
    level: "debug",
    transport: {
      targets: [
        {
          level: "debug",
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
            destination:
              process.platform === "win32"
                ? "C:\\Windows\\Temp\\browserstack-mcp-server.log"
                : "/tmp/browserstack-mcp-server.log",
          },
        },
      ],
    },
  });
} else {
  // Null logger (logs go to /dev/null or NUL)
  currentLogger = pino({
    level: "info",
    transport: {
      target: "pino/file",
      options: {
        destination: process.platform === "win32" ? "NUL" : "/dev/null",
      },
    },
  });
}

// 2. Proxy logger: always delegates to the currentLogger
const logger: any = new Proxy(
  {},
  {
    get(_target, prop) {
      // Forward function calls to currentLogger
      if (typeof currentLogger[prop] === "function") {
        return (...args: any[]) => currentLogger[prop](...args);
      }
      // Forward property gets
      return currentLogger[prop];
    },
  },
);

// 3. Setter to update the logger instance everywhere
export function setLogger(customLogger: any): void {
  currentLogger = customLogger;
}

export default logger;
