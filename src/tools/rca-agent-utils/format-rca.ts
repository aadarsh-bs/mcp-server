// Utility function to format RCA data for better readability
export function formatRCAData(rcaData: any): string {
  if (!rcaData || !rcaData.testCases || rcaData.testCases.length === 0) {
    return "No RCA data available.";
  }

  let output = "## Root Cause Analysis Report\n\n";

  rcaData.testCases.forEach((testCase: any, index: number) => {
    // Show test case ID with smaller heading
    output += `### Test Case ${index + 1}\n`;
    output += `**Test ID:** ${testCase.id}\n`;
    output += `**Status:** ${testCase.state}\n\n`;

    // Access RCA data from the correct path
    const rca = testCase.rcaData?.rcaData;

    if (rca) {
      if (rca.root_cause) {
        output += `**Root Cause:** ${rca.root_cause}\n\n`;
      }

      if (rca.failure_type) {
        output += `**Failure Type:** ${rca.failure_type}\n\n`;
      }

      if (rca.description) {
        output += `**Detailed Analysis:**\n${rca.description}\n\n`;
      }

      if (rca.possible_fix) {
        output += `**Recommended Fix:**\n${rca.possible_fix}\n\n`;
      }
    } else if (testCase.rcaData?.error) {
      output += `**Error:** ${testCase.rcaData.error}\n\n`;
    } else if (testCase.state === "failed") {
      output += `**Note:** RCA analysis failed or is not available for this test case.\n\n`;
    }

    output += "---\n\n";
  });

  return output;
}
