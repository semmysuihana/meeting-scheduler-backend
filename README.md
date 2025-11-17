# Meeting Scheduler Backend 🗓️

[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge\&logo=express\&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)](https://nodejs.org/en/)

## Description

The `meeting-scheduler-backend` is a RESTful API built with Node.js, Express, and TypeScript for scheduling meetings. It allows users to book meetings with organizers, manage booking statuses, and configure organizer settings such as working hours, meeting durations, and blackout dates. The application uses PostgreSQL as its database.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Usage](#usage)
5. [How to use](#how-to-use)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [Prisma Setup](#prisma-setup)
9. [.env.example](#envexample)
10. [Contributing](#contributing)
11. [License](#license)
12. [Important Links](#important-links)
13. [Footer](#footer)

## Features ✨

* **Meeting Booking**: Allows users to book meetings by providing organizer ID, name, email, start time, end time, and timezone.
* **Status Updates**: Enables updating the status of a booking (e.g., booked).
* **Organizer Settings**: Administrators can configure:

  * Working hours
  * Meeting duration
  * Buffer times
  * Minimum notice period
  * Blackout dates
  * Timezone
* **Validations**: Ensures valid inputs, available time slots, and prevents overlapping bookings.
* **Data Retrieval**: Fetch organizer data, booking lists, and individual organizer details.

## Tech Stack 💻

* Node.js
* Express
* TypeScript
* PostgreSQL (pg)
* Prisma ORM
* Luxon
* Dotenv
* CORS

## Installation 🛠️

### 1. Clone the repository

```bash
git clone https://github.com/semmysuihana/meeting-scheduler-backend.git
cd meeting-scheduler-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Buat file `.env` berdasarkan `.env.example`.

### 4. Run database setup

Jika database kosong, gunakan file `init.sql` untuk membuat schema.

```bash
psql -U your_user -d your_database -f init.sql
```

## Usage 🚀

### Start development server

```bash
npm start
```

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm run start:prod
```

## How to use 💡

### Booking a Meeting

POST `/book`

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

PUT `/book/:status/:id/status`

### Updating Organizer Settings

PUT `/settings/:edit/:id`

## Project Structure 📂

```
meeting-scheduler-backend/
├── src/
│   ├── controller/
│   │   ├── getData.ts
│   │   ├── manageData.ts
│   │   ├── validController.ts
│   ├── db.ts
│   ├── index.ts
├── init.sql
├── README.md
├── package.json
```

## API Reference ℹ️

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | `/`                        | Get all organizers        |
| GET    | `/book/:id`                | Get organizer by ID       |
| GET    | `/book/:id/booking`        | Get booking list          |
| POST   | `/book`                    | Create booking            |
| PUT    | `/book/:status/:id/status` | Update booking status     |
| PUT    | `/settings/:edit/:id`      | Update organizer settings |

---

## Prisma Setup 🧩

Project ini menggunakan **Prisma ORM** untuk mengakses database PostgreSQL.
Karena struktur database berasal dari *db pull*, project **tidak memakai Prisma Migrate**, tetapi schema ditentukan oleh **init.sql**.

### 1. Install Prisma

```bash
npm install prisma @prisma/client
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Database Setup

Struktur tabel disediakan dalam `init.sql`, gunakan:

```bash
psql -U your_user -d your_database -f init.sql
```

Pastikan `.env` sudah diisi benar.

---

## .env.example

```
# === POSTGRESQL / PRISMA ===
DB_USER=your_postgres_username
DB_HOST=your_postgres_host
DB_NAME=your_database_name
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Prisma connection string
DATABASE_URL="postgresql://your_postgres_username:your_postgres_password@your_postgres_host/your_database_name?sslmode=require&channel_binding=require"

# === SERVER CONFIG ===
PORT=4000

# Example psql command:
# psql "postgresql://your_postgres_username:your_postgres_password@your_postgres_host/your_database_name?sslmode=require&channel_binding=require"
```

### Cara Memakai `.env.example`

```
cp .env.example .env
```

Isi dengan kredensial PostgreSQL kamu sendiri.

---

## Contributing 🤝

Contributions are welcome! Please follow standard GitHub workflow.

## License 📝

This project uses the ISC License.

## Important Links 🔗

* Repository: [https://github.com/semmysuihana/meeting-scheduler-backend](https://github.com/semmysuihana/meeting-scheduler-backend)

## Footer 🦶

Repository Name: meeting-scheduler-backend
Au
