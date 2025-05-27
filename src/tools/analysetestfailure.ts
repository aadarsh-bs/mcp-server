import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { retrieveObservabilityTestCase, retrieveTestObservabilityLogs } from "./testfailurelogs-utils/observability.js";

export async function analyseTestFailure(args: {
  testId: string;
}): Promise<CallToolResult> {
  try {
    const ollyLogs = await retrieveTestObservabilityLogs(args.testId);
    const ollyTestCase = await retrieveObservabilityTestCase(args.testId);

    // Initialize results array for response
    const results: CallToolResult["content"] = [];
    const response = {
      "failure_logs": ollyLogs,
      "test_case_code": ollyTestCase,
    };

    results.push({ 
      type: "text", 
      text: `${JSON.stringify(response, null, 2)}`
    });
    
    return {
      content: results
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: `Error reading log files: ${errorMessage}`,
        },
      ],
    };
  }
}

// Registers the AnalyseTestFailureTool with the MCP server
export default function addAnalyseTestFailureTool(server: McpServer) {
  server.tool(
    "analyseTestFailure",
    "Fetch the logs of a test run from BrowserStack",
    {
      testId: z.string().describe("The BrowserStack test ID to fetch logs from"),
    },
    async (args) => {
      try {
        return await analyseTestFailure(args);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error during fetching test logs: ${errorMessage}`,
            },
          ],
        };
      }
    },
  );
}
