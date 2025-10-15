/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from '../../sdk/bundle';
import { defineTabTool } from './tool';

const executePlaywrightCode = defineTabTool({
  capability: 'core',
  schema: {
    name: 'browser_execute_playwright_code',
    title: 'Execute Playwright code',
    description: 'Execute Playwright API code directly on the current page. Can execute multiple lines of code from test files like: await page.goto(url), await page.click(selector), await page.fill(selector, text), etc. Use this to execute code from test files line by line.',
    inputSchema: z.object({
      code: z.string().describe('One or more lines of Playwright code to execute. Can include await statements. Examples: "await page.goto(\'https://example.com\')" or "await page.getByRole(\'button\', { name: \'Submit\' }).click();" or multiple lines separated by semicolons.'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    response.setIncludeSnapshot();

    try {
      // Create execution context with page
      const page = tab.page;

      // Split code into lines and execute
      const codeLines = params.code.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

      await tab.waitForCompletion(async () => {
        // Execute the code using AsyncFunction
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

        // Create a function with page in scope
        const fullCode = codeLines.join('\n');
        const executor = new AsyncFunction('page', fullCode);

        const result = await executor(page);

        // Add the code to response
        response.addCode(params.code);

        // Add result if any
        if (result !== undefined)
          response.addResult(JSON.stringify(result, null, 2));
        else
          response.addResult('Code executed successfully');

      });

    } catch (error: any) {
      response.addError(`Execution failed: ${error.message}\n\nStack trace:\n${error.stack || 'No stack trace available'}`);
      response.addCode(params.code);
    }
  },
});

export default [
  executePlaywrightCode,
];
