"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./../db"));
function manageData() {
    let resultInsert = { data: [], error: "", success: "" };
    async function insertData(organizer_id, name, email, start_time_utc, end_time_utc, user_timezone) {
        const query = `
        INSERT INTO booking (organizer_id, name, email, slot_start_utc, slot_end_utc, user_timezone, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        `;
        try {
            const results = await db_1.default.query(query, [organizer_id, name, email, start_time_utc, end_time_utc, user_timezone, "booked"]);
            resultInsert.data = results.rows[0];
            resultInsert.success = "Success to insert data";
        }
        catch (error) {
            console.error(error);
            resultInsert.error = "Failed to insert data";
        }
        return resultInsert;
    }
    async function updateData(organizer_id, // pastikan number
    name, meeting_duration, buffer_before, buffer_after, min_notice_minutes, timezone) {
        const result = {};
        try {
            // 1️⃣ Update tabel settings
            const updateSettingsQuery = `
      UPDATE settings
      SET 
        meeting_duration = $2,
        buffer_before = $3,
        buffer_after = $4,
        min_notice_minutes = $5
      WHERE organizer_id = $1
      RETURNING *;
    `;
            const settingsResult = await db_1.default.query(updateSettingsQuery, [
                organizer_id,
                meeting_duration,
                buffer_before,
                buffer_after,
                min_notice_minutes
            ]);
            result.settings = settingsResult.rows[0];
            // 2️⃣ Update tabel organizer
            const updateOrganizerQuery = `
      UPDATE organizer
      SET name = $2, timezone = $3
      WHERE id = $1
      RETURNING *;
    `;
            const organizerResult = await db_1.default.query(updateOrganizerQuery, [
                organizer_id,
                name,
                timezone
            ]);
            result.organizer = organizerResult.rows[0];
            result.success = "Data updated successfully";
        }
        catch (err) {
            console.error(err);
            result.error = "Failed to update data";
        }
        return result;
    }
    async function updateDataStatus(booking_id, status) {
        const result = {};
        try {
            const updateQuery = `
      UPDATE booking
      SET status = $2
      WHERE id = $1
      RETURNING *;
    `;
            const updateResult = await db_1.default.query(updateQuery, [booking_id, status]);
            result.data = updateResult.rows[0];
            result.success = "Data updated successfully";
        }
        catch (err) {
            console.error(err);
            result.error = "Failed to update data";
        }
        return result;
    }
    async function updateDataWorkingHours(organizer_id, working_hours) {
        const result = {};
        try {
            // 1️⃣ Update tabel settings
            const updateSettingsQuery = `
            UPDATE settings
            SET 
              working_hours = $2
            WHERE organizer_id = $1
            RETURNING *;
          `;
            const settingsResult = await db_1.default.query(updateSettingsQuery, [
                organizer_id,
                working_hours
            ]);
            result.settings = settingsResult.rows[0];
            result.success = "Data updated successfully";
        }
        catch (err) {
            console.error(err);
            result.error = "Failed to update data";
        }
        return result;
    }
    async function updateDataBlackouts(organizer_id, blackouts) {
        const result = {};
        try {
            const blackoutsJson = JSON.stringify(blackouts);
            // 1️⃣ Update tabel settings
            const updateSettingsQuery = `
            UPDATE settings
            SET 
              blackouts = $2
            WHERE organizer_id = $1
            RETURNING *;
          `;
            const settingsResult = await db_1.default.query(updateSettingsQuery, [
                organizer_id,
                blackoutsJson
            ]);
            result.settings = settingsResult.rows[0];
            result.data = settingsResult.rows[0];
            result.success = "Data updated successfully";
        }
        catch (err) {
            console.error(err);
            result.error = "Failed to update data";
        }
        return result;
    }
    return { insertData, updateDataStatus, updateData, updateDataWorkingHours, updateDataBlackouts, resultInsert };
}
exports.default = manageData;
