# Meeting Scheduler Backend 🗓️

[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/en/)

## Description

The `meeting-scheduler-backend` is a RESTful API built with Node.js, Express, and TypeScript for scheduling meetings. It allows users to book meetings with organizers, manage booking statuses, and configure organizer settings such as working hours, meeting durations, and blackout dates. The application uses PostgreSQL as its database.

## Table of Contents

1.  [Features](#features)
2.  [Tech Stack](#tech-stack)
3.  [Installation](#installation)
4.  [Usage](#usage)
5.  [How to use](#how-to-use)
6.  [Project Structure](#project-structure)
7.  [API Reference](#api-reference)
8.  [Contributing](#contributing)
9.  [License](#license)
10. [Important Links](#important-links)
11. [Footer](#footer)

## Features ✨

-   **Meeting Booking**: Allows users to book meetings by providing organizer ID, name, email, start time, end time, and timezone. 📝
-   **Status Updates**: Enables updating the status of a booking (e.g., booked). ✅
-   **Organizer Settings**: Allows administrators to configure organizer-specific settings, including:
    -   Working hours ⏰
    -   Meeting duration ⏳
    -   Buffer time before and after meetings ⏱️
    -   Minimum notice period ⚠️
    -   Blackout dates 🚫
    -   Timezone 🌐
-   **Validations**: Includes comprehensive validations for:
    -   Input data (e.g., email format, required fields) ℹ️
    -   Meeting slot availability (e.g., working hours, blackout dates, minimum notice) 📅
    -   Booking duplication (overlapping bookings) 👯
-   **Data Retrieval**: Provides endpoints for retrieving:
    -   All organizer data ℹ️
    -   Organizer data by ID 🆔
    -   Booking data for a specific organizer 📚

## Tech Stack 💻

-   [Node.js](https://nodejs.org/) - JavaScript runtime environment
-   [Express](https://expressjs.com/) - Web framework for Node.js
-   [TypeScript](https://www.typescriptlang.org/) - Superset of JavaScript which adds static typing
-   [pg](https://node-postgres.com/) - PostgreSQL client for Node.js
-   [dotenv](https://github.com/motdotla/dotenv) - Zero-dependency module that loads environment variables from a `.env` file
-   [luxon](https://moment.github.io/luxon/) - A library for working with dates and times
-   [cors](https://github.com/expressjs/cors) - CORS middleware for Express

## Installation 🛠️

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/semmysuihana/meeting-scheduler-backend.git
    cd meeting-scheduler-backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    -   Create a `.env` file in the root directory.
    -   Add the following variables, replacing the values with your PostgreSQL database credentials:

        ```
        DB_USER=your_db_user
        DB_HOST=your_db_host
        DB_NAME=your_db_name
        DB_PASSWORD=your_db_password
        DB_PORT=your_db_port
        PORT=3000
        ```

4.  **Run database migrations (if applicable):**

    -   This project does not include database migrations, so ensure that the required tables (`organizer`, `settings`, and `booking`) are created in your PostgreSQL database.

## Usage 🚀

1.  **Start the development server:**

    ```bash
    npm start
    ```

    This command uses `ts-node` to run the `src/index.ts` file.

2.  **Build for production:**

    ```bash
    npm run build
    ```

    This command compiles the TypeScript code into JavaScript files in the `dist` directory.

3.  **Start the production server:**

    ```bash
    npm run start:prod
    ```

    This command runs the compiled JavaScript file `dist/index.js` using Node.js.

## How to use 💡

### Booking a Meeting

Send a POST request to the `/book` endpoint with the following JSON payload:

```json
{
  "organizer_id": "123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "start_time_utc": "2024-01-01T10:00:00.000Z",
  "end_time_utc": "2024-01-01T11:00:00.000Z",
  "user_timezone": "America/Los_Angeles"
}
```

### Updating Booking Status

Send a PUT request to `/book/:status/:id/status` endpoint. Replace `:status` with the new status and `:id` with the booking ID. Include any required payload data in the request body.

For example, to update a booking status to `booked`:

```
PUT /book/booked/123/status
Content-Type: application/json

{
  "payload": {
    "organizer_id": "some_organizer_id",
    "start_time_utc": "2024-01-02T10:00:00.000Z",
    "end_time_utc": "2024-01-02T11:00:00.000Z",
    "user_timezone": "America/Los_Angeles"
  }
}
```

### Updating Organizer Settings

Send a PUT request to `/settings/:edit/:id` endpoint. Replace `:edit` with the setting type (`general`, `working_hours`, or `blackouts`) and `:id` with the organizer ID.  Include the new setting data in the request body.

For example, to update general settings:

```
PUT /settings/general/123
Content-Type: application/json

{
  "name": "New Organizer Name",
  "meeting_duration": 60,
  "buffer_before": 10,
  "buffer_after": 10,
  "min_notice_minutes": 30,
  "timezone": "America/Los_Angeles"
}
```

To update working hours:

```
PUT /settings/working_hours/123
Content-Type: application/json

{
  "working_hours": {
    "monday": "09:00-17:00",
    "tuesday": "09:00-17:00",
    "wednesday": "09:00-17:00",
    "thursday": "09:00-17:00",
    "friday": "09:00-17:00",
    "saturday": "",
    "sunday": ""
  }
}
```

To update blackout dates:

```
PUT /settings/blackouts/123
Content-Type: application/json

{
  "blackouts": ["2024-12-25", "2024-01-01"]
}
```

## Project Structure 📂

```
meeting-scheduler-backend/
├── src/
│   ├── controller/
│   │   ├── getData.ts         # Data retrieval logic
│   │   ├── manageData.ts      # Data manipulation logic (insert, update)
│   │   ├── validController.ts # Validation logic
│   ├── db.ts                # Database connection setup
│   ├── index.ts             # Main application entry point
├── README.md              # Project documentation
├── package.json           # Project dependencies and scripts
```

## API Reference ℹ️

### Endpoints

| Method | Endpoint                       | Description                                                                           | Request Body                                                                                                                                                                                                                            | Response Body                                                                                       |
| :----- | :----------------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| GET    | `/`                            | Retrieves all organizer data.                                                         | None                                                                                                                                                                                                                                    | Array of organizer objects.                                                                         |
| GET    | `/book/:id`                     | Retrieves organizer data by ID.                                                       | None                                                                                                                                                                                                                                    | Organizer object.                                                                                   |
| GET    | `/book/:id/booking`             | Retrieves all bookings for an organizer, including organizer settings                   | None                                                                                                                                                                                                                                    | Array of booking objects with organizer details.                                                    |
| POST   | `/book`                          | Creates a new booking.                                                              | `{ organizer_id, name, email, start_time_utc, end_time_utc, user_timezone }`                                                                                                                                                       | `{ success: string }` or `{ error: string }`                                                          |
| PUT    | `/book/:status/:id/status`      | Updates the status of a booking.                                                      | `{ payload: {organizer_id, start_time_utc, end_time_utc, user_timezone} }` (Payload Required when changing the status to booked for validation purposes)                                                                          | `{ success: string, data: object }` or `{ error: string }`                                          |
| PUT    | `/settings/:edit/:id`          | Updates organizer settings (general, working hours, blackouts).                         | Varies depending on the `:edit` parameter (see "How to use" section for examples)                                                                                                                                                | `{ success: string, data: object }` or `{ error: string }`                                          |

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Submit a pull request.

## License 📝

This project is under the [ISC License](https://opensource.org/license/isc/).

## Important Links 🔗

*   [Repository Link](https://github.com/semmysuihana/meeting-scheduler-backend)

## Footer 🦶


*   Repository Name: meeting-scheduler-backend
*   Repository URL: [https://github.com/semmysuihana/meeting-scheduler-backend](https://github.com/semmysuihana/meeting-scheduler-backend)
*   Author: [semmysuihana](https://github.com/semmysuihana)


Feel free to fork, contribute, and help improve this project! Give it a star ⭐ if you find it useful. If you encounter any issues, please submit them to the [issue tracker](https://github.com/semmysuihana/meeting-scheduler-backend/issues).


---
**<p align="center">Generated by [ReadmeCodeGen](https://www.readmecodegen.com/)</p>**