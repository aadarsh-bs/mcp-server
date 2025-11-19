import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PercyIntegrationTypeEnum } from "./sdk-utils/common/types.js";
import { BrowserStackConfig } from "../lib/types.js";
import { getBrowserStackAuth } from "../lib/get-auth.js";
import { fetchPercyToken } from "./sdk-utils/percy-web/fetchPercyToken.js";
import { storedPercyResults } from "../lib/inmemory-store.js";
import {
  getFrameworkTestCommand,
  PERCY_FALLBACK_STEPS,
} from "./sdk-utils/percy-web/constants.js";
import path from "path";

export async function runPercyScan(
  args: {
    projectName: string;
    integrationType: PercyIntegrationTypeEnum;
    instruction?: string;
  },
  config: BrowserStackConfig,
): Promise<CallToolResult> {
  const { projectName, integrationType, instruction } = args;
  const authorization = getBrowserStackAuth(config);
  const percyToken = await fetchPercyToken(projectName, authorization, {
    type: integrationType,
  });

  // Check if we have stored data and project matches
  const stored = storedPercyResults.get();

  // Compute if we have updated files to run
  const hasUpdatedFiles = checkForUpdatedFiles(stored, projectName);
  const updatedFiles = hasUpdatedFiles ? getUpdatedFiles(stored) : [];

  // Build steps array with conditional spread
  const steps = [
    generatePercyTokenInstructions(percyToken),
    ...(hasUpdatedFiles ? generateUpdatedFilesSteps(stored, updatedFiles) : []),
    ...(instruction && !hasUpdatedFiles
      ? generateInstructionSteps(instruction)
      : []),
    ...(!hasUpdatedFiles ? PERCY_FALLBACK_STEPS : []),
  ];

  const instructionContext = steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: instructionContext,
      },
    ],
  };
}

function generatePercyTokenInstructions(percyToken: string): string {
  return `Set the environment variable for your project:

export PERCY_TOKEN="${percyToken}"

(For Windows: use 'setx PERCY_TOKEN "${percyToken}"' or 'set PERCY_TOKEN=${percyToken}' as appropriate.)`;
}

const toAbs = (p: string): string | undefined =>
  p ? path.resolve(p) : undefined;

function checkForUpdatedFiles(
  stored: any, // storedPercyResults structure
  projectName: string,
): boolean {
  const projectMatches = stored?.projectName === projectName;
  return (
    projectMatches &&
    stored?.testFiles &&
    Object.values(stored.testFiles).some((status) => status === true)
  );
}

function getUpdatedFiles(stored: any): string[] {
  const updatedFiles: string[] = [];
  const fileStatusMap = stored.testFiles;

  Object.entries(fileStatusMap).forEach(([filePath, status]) => {
    if (status === true) {
      updatedFiles.push(filePath);
    }
  });

  return updatedFiles;
}

function generateUpdatedFilesSteps(
  stored: any,
  updatedFiles: string[],
): string[] {
  const filesToRun = updatedFiles.map(toAbs).filter(Boolean) as string[];
  const { detectedLanguage, detectedTestingFramework } = stored;
  const exampleCommand = getFrameworkTestCommand(
    detectedLanguage,
    detectedTestingFramework,
  );

  return [
    `Run only the updated files with Percy:\n` +
      `Example: ${exampleCommand} <file1> <file2> ...`,
    `Updated files to run:\n${filesToRun.join("\n")}`,
  ];
}

function generateInstructionSteps(instruction: string): string[] {
  return [
    `Use the provided test command with Percy:\n${instruction}`,
    `If this command fails or is incorrect, fall back to the default approach below.`,
  ];
}
