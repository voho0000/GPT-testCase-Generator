# Test Case Generation Chrome Extension Project

This is a Chrome extension that allows users to generate test cases from selected text on a webpage.

## Features

- Select text or Use information from a asana ticket to generate test cases
- Display the generated test cases in a popup
- User input in prompt and form

## Project Structure

- `background.ts`: This is the background script for the extension. It handles the communication with the server and sends the selected text for processing. It also receives the response from the server and displays it in the popup.
- `popup.vue`: This is the Vue component for the popup. It displays the data received from the `background.ts` script.
- `prompt.vue`: This is a Vue component where the users can add and edit their prompt template.
- `form.vue`: This is another Vue component for user input to create test case in asana.

## Installation

1. Clone the repository
```bash
git clone https://github.com/voho0000/GPT-TESTCASE-GENERATOR.git
```
2. Navigate to the project directory
```bash
cd GPT-TESTCASE-GENERATOR
```
3. Install the dependencies
```bash
npm install
```
4. Build the project
```bash
npm run build
```
5. Load the extension into Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory in your project

## Usage

1. Navigate to a webpage and select some text.
2. Right-click and select 'Generate Test Case' from the context menu.
3. The generated test cases will be displayed in a popup.
4. You can also input data in the prompt and form.


## License

[MIT](https://choosealicense.com/licenses/mit/)