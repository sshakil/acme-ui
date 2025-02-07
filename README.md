# ACME IoT UI

Author: Saad Shakil  
[https://sshakil.github.io](https://sshakil.github.io)

## Table of Contents
- [Root and Sub-Repo Directory Structure](#root-and-sub-repo-directory-structure)
- [Installation](#installation)
- [Usage](#usage)
- [WebSocket Integration](#websocket-integration)
- [Logging and Debugging](#logging-and-debugging)
- [Coding Principles](#coding-principles)
    - [Modular Architecture](#modular-architecture)
    - [Directory Structure](#directory-structure)
- [Next Steps](#next-steps)
- [License](#license)

## Root and Sub-Repo Directory Structure
If you're interested in exploring the code and setting up a live dev env, this is the structure I used:
```sh
ACME
.
├── ACME-REST
├── ACME-simulator
├── README.md
├── acme-ui
└── docker-compose.yml
```
##### Repo Links
[ACME](https://github.com/sshakil/ACME) - Root Proj <br>
[ACME-REST](https://github.com/sshakil/ACME-REST) - REST API <br>
[ACME-simulator](https://github.com/sshakil/ACME-simulator) - CLI Simulator <br>
[acme-ui](https://github.com/sshakil/acme-ui) - React UI (this) <br>

## Installation

Ensure you have Node.js installed, then install dependencies:

```sh
npm install
```

Run the development server:

```sh
npm run dev
```

## Usage

The UI provides a live dashboard for monitoring IoT devices and sensors. When a device is registered or sensor readings are simulated through the CLI, the UI updates automatically through WebSocket events.

## WebSocket Integration

- The UI listens for WebSocket events:
    - `device-created`
      - Updates the device list when a new device is registered.
    - `sensors-update`
      - Updates sensor data when new readings are received.
      - Includes updates to sensor's type and unit.
- Events can be observed in the **developer console**.
- If an event is missed, the UI automatically falls back to an API poll to fetch the latest data.

[Back to top](#table-of-contents)

## Logging and Debugging

- **Log Levels:**
    - `disabled`: No logs.
    - `minimal`: Basic event logs.
    - `verbose`: Logs full event payloads.
- Adjust `VITE_LOG_LEVEL` in `.env` to change verbosity.
- WebSocket events and API calls are logged for debugging purposes.

## Coding Principles

### Modular Architecture

- The project follows a component-based structure with reusable UI elements.
- API calls are centralized in `api.js`.
- The WebSocket connection is managed globally to avoid redundant connections.

### Directory Structure

```
.
├── Dockerfile
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   └── acme.png
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── api.js
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── DeviceTable.jsx
│   │   └── SensorTable.jsx
│   ├── index.css
│   ├── main.jsx
│   └── theme.js
├── start.sh
└── vite.config.js
```

[Back to top](#table-of-contents)

## Next Steps

- **Local Redux Store Usage:** Implement a local Redux store to manage device and sensor states efficiently, reducing reliance on frequent API calls.
- **Centralized Event Management:** Extract WebSocket event names into a shared library for consistency.
- **Optimizing API Data Handling:** Modify API responses to work with data IDs, reducing bandwidth and transit size for improved performance.
- **Enhance UI Components:** Implement filtering and sorting for device and sensor tables.

## License

This project is licensed under a private license for educational purposes and the author's skill-set evaluation for job or contract applications only. You may use, modify, and learn from the code provided here solely for your personal educational use or the evaluation of the author's skill-set during a job or contract application process. Redistribution, commercial use, or privately sharing of this code for any other purpose than identified or sharing it publicly in any form for any purpose is strictly prohibited without explicit permission from the author.

By using this software, you acknowledge that it is provided "as is" without any warranties, express or implied, including but not limited to fitness for a particular purpose. The author shall not be held liable for any damages, losses, or other consequences arising from the use or misuse of this software. You agree to indemnify and hold the author harmless from any claims, liabilities, or expenses related to your use of this software.

[Back to top](#table-of-contents)

