"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./../db"));
function getData() {
    const message = { error: "", success: "", data: [] };
    async function getDataMeeting() {
        const query = `
      SELECT o.*, s.working_hours, s.meeting_duration, s.buffer_before, s.buffer_after, s.min_notice_minutes, s.blackouts
      FROM organizer o
      RIGHT JOIN settings s ON o.id = s.organizer_id
      ORDER BY o.id ASC;
    `;
        try {
            const results = await db_1.default.query(query); // harus mendukung await
            message.data = results.rows;
            message.success = "Success to get data";
        }
        catch (error) {
            console.error(error);
            message.error = "Failed to get data";
        }
        return message;
    }
    async function getDataMeetingById(organizerId) {
        const message = { error: "", success: "", data: [] };
        const query = `
        SELECT o.*, s.working_hours, s.meeting_duration, s.buffer_before, s.buffer_after, s.min_notice_minutes, s.blackouts
        FROM organizer o
        RIGHT JOIN settings s ON o.id = s.organizer_id
        WHERE o.id = $1
        ORDER BY o.id ASC;
      `;
        try {
            const results = await db_1.default.query(query, [organizerId]);
            message.data = results.rows;
            message.success = "Success to get data";
        }
        catch (error) {
            console.error(error);
            message.error = "Failed to get data";
        }
        return message;
    }
    async function getDataBooking(organizerId, status) {
        const query = `
   SELECT b.*, o.name AS organizer_name, o.timezone AS organizer_timezone
   ${status === "all" ? ", s.working_hours, s.meeting_duration, s.buffer_before, s.buffer_after, s.min_notice_minutes, s.blackouts" : ""}
FROM booking b
INNER JOIN organizer o ON b.organizer_id = o.id
    ${status === "all" ? "INNER JOIN settings s ON b.organizer_id = s.organizer_id" : ""}
WHERE b.organizer_id = $1
  ${status === "all" ? "" : "AND b.status = 'booked'"}
  AND b.slot_end_utc > NOW() AT TIME ZONE 'UTC'
    `;
        try {
            const results = await db_1.default.query(query, [organizerId]);
            message.data = results.rows;
            message.success = "Success to get data";
        }
        catch (error) {
            console.error(error);
            message.error = "Failed to get data";
        }
        return message;
    }
    return { getDataMeeting, getDataMeetingById, getDataBooking };
}
exports.default = getData;
