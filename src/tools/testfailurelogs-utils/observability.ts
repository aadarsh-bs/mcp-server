import config from "../../config.js";
import { BrowserstackLogTypes } from "../../lib/constants.js";
import logger from "../../logger.js";
import { HarEntry, HarFile, validateLogResponse } from "../failurelogs-utils/utils.js";
import { filterConsoleFailures, filterSessionFailures } from "../failurelogs-utils/automate.js";
import { filterAppiumFailures, filterCrashFailures, filterDeviceFailures } from "../failurelogs-utils/app-automate.js";

const auth = Buffer.from(
  `${config.browserstackUsername}:${config.browserstackAccessKey}`,
).toString("base64");

export interface TestObservabilityLog {
  sdkLogs: string[];
  failureLogs: any[];
  browserstackLogs?: any | null;
  hookRunLogs: string[];
  framework?: string | null;
}

export interface ObservabilityTestDetails {
  testCode: any
  testMetadata: any
}

// Interface for log structure
export interface TestObservabilityLogResponse {
  testStartedAt?: string;
  testFinishedAt?: string;
  browserstackLogs?: any | null;
  sdkLogs: string[];
  hookRunLogs: string[];
  failureLogs: any[];
  stepLogs: any[];
  framework?: string | null;
  sessionId?: string | null;
}

export async function retrieveObservabilityTestCase(
  testId: string
): Promise<string> {
  const url = `https://api-observability.browserstack.com/ext/v1/testRun/${testId}/details`
    
    const ollyTestDetailsRaw = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });
  const ollyTestDetails = await ollyTestDetailsRaw.json() as ObservabilityTestDetails;
  const testCode = ollyTestDetails.testCode.code;
  return testCode
}

/**
 * Retrieves test observability logs from BrowserStack
 * @param testId The test ID to fetch logs for
 * @returns The test logs data
 */
export async function retrieveTestObservabilityLogs(
  testId: string
): Promise<TestObservabilityLog> {
  logger.info(`Retrieving observability logs for test ID: ${testId}`);
  
  try {    
    const url = `https://api-observability.browserstack.com/ext/v1/testRun/${testId}/logs`
    
    const ollyLogsRaw = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    const ollyLogs = await ollyLogsRaw.json() as TestObservabilityLogResponse;
    
    // Prepare the response object
    const response = {
      failureLogs: ollyLogs.failureLogs,
      sdkLogs: await getFilteredSdkLogs(ollyLogs.sdkLogs, ollyLogs.testStartedAt, ollyLogs.testFinishedAt),
      browserstackLogs: await getFilteredBrowserstackLogs(ollyLogs.browserstackLogs, ollyLogs.testStartedAt, ollyLogs.testFinishedAt),
      hookRunLogs: await getFilteredHookRunLogs(ollyLogs.hookRunLogs, ollyLogs.testStartedAt, ollyLogs.testFinishedAt),
      framework: ollyLogs.framework,
    };

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to retrieve observability logs: ${errorMessage}`);
    throw new Error(`Failed to retrieve observability logs: ${errorMessage}`);
  }
}

async function getFilteredSdkLogs(
  sdkLogs: string[],
  testStartedAt?: string,
  testFinishedAt?: string
): Promise<string[]> {

  let filteredLogs: string[] = [];

  for (const log of sdkLogs) {
    const logContent = await fetch(log).then(res => res.text());

    // TODO: filtering logic to be added here
    // let filteredLog = ""
    // logContent.split("\n").forEach(line => {
    //   const logTime = new Date(line).getTime();
    //   if (
    //     (!testStartedAt || logTime >= new Date(testStartedAt).getTime()) &&
    //     (!testFinishedAt || logTime <= new Date(testFinishedAt).getTime())
    //   ) {
    //     filteredLog += line + "\n";
    //   }
    // })
    
    filteredLogs.push(logContent);
  }

  return filteredLogs;
}

async function getFilteredHookRunLogs(
  hookRunLogs: string[],
  testStartedAt?: string,
  testFinishedAt?: string
): Promise<string[]> {

  let filteredLogs: string[] = [];

  for (const log of hookRunLogs) {
    const logContent = await fetch(log).then(res => res.text());

    // TODO: filtering logic to be added here
    
    filteredLogs.push(logContent);
  }

  return filteredLogs;
}


async function getFilteredBrowserstackLogs(
  browserstackLogs: any,
  testStartedAt?: string,
  testFinishedAt?: string
): Promise<any> {
  // If there are no browserstack logs, return an empty object
  if (!browserstackLogs) {
    return {};
  }

  let result: Record<string, any> = {};

  // Process each log type from the browserstackLogs object
  for (const logType in browserstackLogs) {
    try {
      const logData = browserstackLogs[logType];
      let finalLogContent;

      switch (logType) {
        case BrowserstackLogTypes.Network: {
          if (logData.url) {
            finalLogContent = await validateAndFilterNetworkLogs(logData.url);
          }
          break;
        }

        case BrowserstackLogTypes.Session: {
          if (logData.url) {
            finalLogContent = await validateAndFilterSessionLogs(logData.url);
          }
          break;
        }

        case BrowserstackLogTypes.Console: {
          if (logData.url) {
            finalLogContent = await validateAndFilterConsoleLogs(logData.url);
          }
          break;
        }

        case BrowserstackLogTypes.Device: {
          if (logData.url) {
            finalLogContent = await validateAndFilterDeviceLogs(logData.url);
          }
          break;
        }

        case BrowserstackLogTypes.Appium: {
          if (logData.url) {
            finalLogContent = await validateAndFilterAppiumLogs(logData.url);
          }
          break;
        }

        case BrowserstackLogTypes.Crash: {
          if (logData.url) {
            finalLogContent = await validateAndFilterCrashLogs(logData.url);
          }
          break;
        }
      }
      result[logType] = finalLogContent ;
    } catch (error) {
      // If fetching a particular log fails, log the error but continue with other logs
      logger.error(`Failed to fetch ${logType} logs: ${error instanceof Error ? error.message : String(error)}`);
      result[logType] = null; // Set to null or an empty object if needed
    }
  }

  return result;
}

export async function validateAndFilterNetworkLogs(
  url: string,
): Promise<string> {
  const response = await fetch(url);
  const validationError = validateLogResponse(response, "network logs");
  if (validationError) {
    return validationError.message!;
  }

  // TODO: filter the time
  const networklogs: HarFile = await response.json();
  const failureEntries: HarEntry[] = networklogs.log.entries.filter(
    (entry: HarEntry) =>
      entry.response.status === 0 ||
      entry.response.status >= 400 ||
      entry.response._error !== undefined,
  );

  return failureEntries.length > 0
    ? `Network Failures (${failureEntries.length} found):\n${JSON.stringify(
        failureEntries.map((entry: any) => ({
          startedDateTime: entry.startedDateTime,
          request: {
            method: entry.request?.method,
            url: entry.request?.url,
            queryString: entry.request?.queryString,
          },
          response: {
            status: entry.response?.status,
            statusText: entry.response?.statusText,
            _error: entry.response?._error,
          },
          serverIPAddress: entry.serverIPAddress,
          time: entry.time,
        })),
        null,
        2,
      )}`
    : "No network failures found";
}

// SESSION LOGS
export async function validateAndFilterSessionLogs(
  url: string,
): Promise<string> {

  const response = await fetch(url);

  const validationError = validateLogResponse(response, "session logs");
  if (validationError) return validationError.message!;

  const logText = await response.text();
  const logs = filterSessionFailures(logText);
  return logs.length > 0
    ? `Session Failures (${logs.length} found):\n${JSON.stringify(logs, null, 2)}`
    : "No session failures found";
}

// CONSOLE LOGS
export async function validateAndFilterConsoleLogs(
  url: string,
): Promise<string> {

  const response = await fetch(url);

  const validationError = validateLogResponse(response, "console logs");
  if (validationError) return validationError.message!;

  const logText = await response.text();
  const logs = filterConsoleFailures(logText);
  return logs.length > 0
    ? `Console Failures (${logs.length} found):\n${JSON.stringify(logs, null, 2)}`
    : "No console failures found";
}

// DEVICE LOGS
export async function validateAndFilterDeviceLogs(
  url: string
): Promise<string> {

  const response = await fetch(url);

  const validationError = validateLogResponse(response, "device logs");
  if (validationError) return validationError.message!;

  const logText = await response.text();
  const logs = filterDeviceFailures(logText);
  return logs.length > 0
    ? `Device Failures (${logs.length} found):\n${JSON.stringify(logs, null, 2)}`
    : "No device failures found";
}

// APPIUM LOGS
export async function validateAndFilterAppiumLogs(
  url: string
): Promise<string> {

  const response = await fetch(url);

  const validationError = validateLogResponse(response, "Appium logs");
  if (validationError) return validationError.message!;

  const logText = await response.text();
  const logs = filterAppiumFailures(logText);
  return logs.length > 0
    ? `Appium Failures (${logs.length} found):\n${JSON.stringify(logs, null, 2)}`
    : "No Appium failures found";
}

// CRASH LOGS
export async function validateAndFilterCrashLogs(
  url: string
): Promise<string> {

  const response = await fetch(url);

  const validationError = validateLogResponse(response, "crash logs");
  if (validationError) return validationError.message!;

  const logText = await response.text();
  const logs = filterCrashFailures(logText);
  return logs.length > 0
    ? `Crash Failures (${logs.length} found):\n${JSON.stringify(logs, null, 2)}`
    : "No crash failures found";
}