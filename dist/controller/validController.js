"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
function validController() {
    const message = { error: "", success: "" };
    // Validasi input dasar
    function checkValid(organizer_id, name, email, start_time_utc, end_time_utc, user_timezone) {
        if (!name || !email || !start_time_utc || !end_time_utc || !user_timezone) {
            message.error = "All fields are required";
            return false;
        }
        if (!email.includes("@")) {
            message.error = "Invalid email";
            return false;
        }
        if (!luxon_1.DateTime.fromISO(start_time_utc).isValid || !luxon_1.DateTime.fromISO(end_time_utc).isValid) {
            message.error = "Invalid start/end time format";
            return false;
        }
        if (start_time_utc >= end_time_utc) {
            message.error = "Start time must be before end time";
            return false;
        }
        if (!luxon_1.IANAZone.isValidZone(user_timezone)) {
            message.error = "Invalid timezone";
            return false;
        }
        if (!organizer_id) {
            message.error = "Organizer ID is required";
            return false;
        }
        return true;
    }
    // Validasi slot meeting
    function checkValidMeeting(organizerData, start_time_utc, end_time_utc, user_timezone) {
        const startUTC = luxon_1.DateTime.fromISO(start_time_utc, { zone: "utc" });
        const endUTC = luxon_1.DateTime.fromISO(end_time_utc, { zone: "utc" });
        const nowUTC = luxon_1.DateTime.now().toUTC();
        // Minimum notice
        if (startUTC < nowUTC.plus({ minutes: organizerData.min_notice_minutes })) {
            message.error = `Start time must be at least ${organizerData.min_notice_minutes} minutes in the future`;
            return false;
        }
        // Cek blackout
        // Misal blackout: ["2025-11-17", "2025-12-10"]
        for (const blackout of organizerData.blackouts) {
            const blackoutStart = luxon_1.DateTime.fromISO(blackout.date, { zone: organizerData.timezone }).startOf("day").toUTC();
            const blackoutEnd = luxon_1.DateTime.fromISO(blackout.date, { zone: organizerData.timezone }).endOf("day").toUTC();
            if ((startUTC >= blackoutStart && startUTC <= blackoutEnd) ||
                (endUTC >= blackoutStart && endUTC <= blackoutEnd) ||
                (startUTC <= blackoutStart && endUTC >= blackoutEnd)) {
                message.error = "The selected time is unavailable (blackout).";
                return false;
            }
            console.log("Blackout UTC:", blackoutStart.toISO(), "-", blackoutEnd.toISO());
        }
        console.log("==== START SLOT VALIDATION ====");
        console.log("User slot UTC:", startUTC.toISO(), "-", endUTC.toISO());
        console.log("Organizer timezone:", organizerData.timezone);
        // Gunakan tanggal dari startUTC tapi di zona organizer
        const startDateInOrganizerTZ = startUTC.setZone(organizerData.timezone);
        const dayName = startDateInOrganizerTZ.toFormat("cccc").toLowerCase();
        console.log("Day name in organizer timezone:", dayName);
        const hoursStr = organizerData.working_hours[dayName];
        console.log("Working hours string:", hoursStr);
        let slotValid = false;
        if (hoursStr &&
            organizerData.meeting_duration &&
            organizerData.buffer_before != null &&
            organizerData.buffer_after != null &&
            organizerData.min_notice_minutes != null) {
            const [wStart, wEnd] = hoursStr.split("-");
            console.log("Parsed working hours:", { wStart, wEnd });
            // Build wStartUTC dan wEndUTC berdasarkan tanggal startUTC
            let wStartUTC = luxon_1.DateTime.fromObject({
                year: startDateInOrganizerTZ.year,
                month: startDateInOrganizerTZ.month,
                day: startDateInOrganizerTZ.day,
                hour: parseInt(wStart.split(":")[0]),
                minute: parseInt(wStart.split(":")[1]),
                second: 0,
            }, { zone: organizerData.timezone }).toUTC();
            let wEndUTC = luxon_1.DateTime.fromObject({
                year: startDateInOrganizerTZ.year,
                month: startDateInOrganizerTZ.month,
                day: startDateInOrganizerTZ.day,
                hour: parseInt(wEnd.split(":")[0]),
                minute: parseInt(wEnd.split(":")[1]),
                second: 0,
            }, { zone: organizerData.timezone }).toUTC();
            console.log("Initial working hours UTC:", wStartUTC.toISO(), "-", wEndUTC.toISO());
            // cross-midnight
            if (wEndUTC <= wStartUTC) {
                wEndUTC = wEndUTC.plus({ days: 1 });
                console.log("Adjusted for cross-midnight:", wStartUTC.toISO(), "-", wEndUTC.toISO());
            }
            const bufferGap = organizerData.buffer_before + organizerData.buffer_after;
            console.log("Meeting duration:", organizerData.meeting_duration, "minutes");
            console.log("Buffer before + after:", bufferGap, "minutes");
            console.log("Minimum notice minutes:", organizerData.min_notice_minutes);
            let current = wStartUTC;
            let slotIndex = 1;
            while (current.plus({ minutes: organizerData.meeting_duration }) <= wEndUTC) {
                const slotEnd = current.plus({ minutes: organizerData.meeting_duration });
                console.log(`\n[Slot ${slotIndex}]`, current.toISO(), "-", slotEnd.toISO());
                // cek min notice
                const diffMinutes = current.diffNow("minutes").minutes;
                console.log(`[Slot ${slotIndex}] Minutes until slot start from now:`, diffMinutes.toFixed(2));
                if (diffMinutes < organizerData.min_notice_minutes) {
                    console.log(`[Slot ${slotIndex}] ❌ Skip slot, min notice belum terpenuhi`);
                    current = slotEnd.plus({ minutes: bufferGap });
                    slotIndex++;
                    continue;
                }
                // cek user slot masuk
                console.log(`[Slot ${slotIndex}] Checking user slot:`, startUTC.toISO(), "-", endUTC.toISO());
                if (startUTC >= current && endUTC <= slotEnd) {
                    console.log(`[Slot ${slotIndex}] ✅ User slot masuk slot ini`);
                    slotValid = true;
                    break;
                }
                else {
                    console.log(`[Slot ${slotIndex}] ❌ User slot tidak masuk slot ini`);
                }
                current = slotEnd.plus({ minutes: bufferGap });
                slotIndex++;
            }
        }
        if (!slotValid) {
            message.error = "Selected time does not fit a slot or is outside the working hours";
            return false;
        }
        console.log("==== END SLOT VALIDATION ====");
        return true;
    }
    function isTimeOverlap(startA, endA, startB, endB) {
        const overlap = startA < endB && endA > startB;
        console.log("Checking overlap:");
        console.log("  Slot A:", startA.toISO(), "-", endA.toISO());
        console.log("  Slot B:", startB.toISO(), "-", endB.toISO());
        console.log("  Overlap result:", overlap);
        return overlap;
    }
    function checkValidDuplication(bookings, start_time_utc, end_time_utc) {
        console.log("start_time_utc", start_time_utc, "end_time_utc", end_time_utc);
        // Pastikan start/end user selalu DateTime
        const startUTC = luxon_1.DateTime.fromISO(start_time_utc, { zone: "utc" });
        const endUTC = luxon_1.DateTime.fromISO(end_time_utc, { zone: "utc" });
        console.log("setelah convert start_time_utc", startUTC, "end_time_utc", endUTC);
        console.log("==== START DUPLICATION CHECK ====");
        console.log("User slot UTC:", startUTC.toISO(), "-", endUTC.toISO());
        console.log("Existing bookings count:", bookings.length);
        for (const [idx, booking] of bookings.entries()) {
            // Aman: bisa string ISO atau Date object
            let bookingStart;
            let bookingEnd;
            if (typeof booking.slot_start_utc === "string") {
                bookingStart = luxon_1.DateTime.fromISO(booking.slot_start_utc);
            }
            else if (booking.slot_start_utc instanceof Date) {
                bookingStart = luxon_1.DateTime.fromJSDate(booking.slot_start_utc);
            }
            else {
                console.warn(`[Booking ${idx + 1}] Invalid start time format:`, booking.slot_start_utc);
                continue;
            }
            if (typeof booking.slot_end_utc === "string") {
                bookingEnd = luxon_1.DateTime.fromISO(booking.slot_end_utc);
            }
            else if (booking.slot_end_utc instanceof Date) {
                bookingEnd = luxon_1.DateTime.fromJSDate(booking.slot_end_utc);
            }
            else {
                console.warn(`[Booking ${idx + 1}] Invalid end time format:`, booking.slot_end_utc);
                continue;
            }
            console.log(`\n[Booking ${idx + 1}]`);
            console.log("  Existing booking slot UTC:", bookingStart.toISO(), "-", bookingEnd.toISO());
            if (isTimeOverlap(startUTC, endUTC, bookingStart, bookingEnd)) {
                message.error = "Selected time is already booked";
                console.log("❌ Duplicate found! Slot cannot be booked.");
                console.log("==== END DUPLICATION CHECK ====");
                return false;
            }
            else {
                console.log("✅ No overlap with this booking.");
            }
        }
        message.success = "Slot is valid";
        console.log("✅ No duplication found. Slot is valid.");
        console.log("==== END DUPLICATION CHECK ====");
        return true;
    }
    function checkValidSettingGeneral(id, name, meeting_duration, buffer_before, buffer_after, min_notice_minutes, timezone, dataBooking) {
        if (!name) {
            message.error = "Name cannot be empty";
            return false;
        }
        if (!meeting_duration || meeting_duration < 30 || meeting_duration > 240) {
            message.error = "Meeting duration must be between 30 and 240 minutes";
            return false;
        }
        if (!buffer_before || buffer_before < 0 || buffer_before > 60) {
            message.error = "Buffer before must be between 0 and 60 minutes";
            return false;
        }
        if (!buffer_after || buffer_after < 0 || buffer_after > 60) {
            message.error = "Buffer after must be between 0 and 60 minutes";
            return false;
        }
        if (!min_notice_minutes || min_notice_minutes < 0 || min_notice_minutes > 120) {
            message.error = "Min notice minutes must be between 0 and 120 minutes";
            return false;
        }
        if (!timezone) {
            message.error = "Timezone cannot be empty";
            return false;
        }
        if (luxon_1.IANAZone.isValidZone(timezone) === false) {
            message.error = "Invalid timezone";
            return false;
        }
        if (dataBooking.length > 0) {
            message.error = `Organizer has already created a meeting as booked, cannot update settings, please cancel or reschedule the meeting first. 
    This is data booking: ${dataBooking.map((item) => "Id: " + item.id + " Name: " + item.name).join(", ")}`;
            return false;
        }
        return true;
    }
    function checkValidSettingWorkingHours(id, working_hours, dataBooking) {
        console.log("checkValidSettingWorkingHours", id, working_hours, dataBooking);
        if (!id || !working_hours || !dataBooking) {
            message.error = "All fields are required";
            return false;
        }
        // 1️⃣ Pastikan working_hours berbentuk object
        if (!working_hours || typeof working_hours !== "object" || Array.isArray(working_hours)) {
            message.error = "Working hours must be an object with days as keys";
            return false;
        }
        // 2️⃣ Pastikan tidak kosong
        if (Object.keys(working_hours).length === 0) {
            message.error = "Working hours cannot be empty";
            return false;
        }
        // 3️⃣ Validasi tiap hari
        const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (const day in working_hours) {
            const val = working_hours[day].trim();
            // Cek hari valid
            if (!validDays.includes(day.toLowerCase())) {
                message.error = `Invalid day: ${day}. Must be one of ${validDays.join(", ")}`;
                return false;
            }
            // Kosong boleh
            if (!val)
                continue;
            // Format HH:MM-HH:MM
            const regex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
            if (!regex.test(val)) {
                message.error = `Invalid time format for ${day}: ${val}. Use HH:MM-HH:MM`;
                return false;
            }
            // Cek start < end
            const [start, end] = val.split("-");
            if (start >= end) {
                message.error = `Start time must be before end time for ${day}: ${val}`;
                return false;
            }
        }
        // 4️⃣ Cek booking aktif
        if (dataBooking && dataBooking.length > 0) {
            message.error = `Organizer has already created a meeting as booked, cannot update settings. 
This is data booking: ${dataBooking
                .map((item) => "Id: " + item.id + " Name: " + item.name)
                .join(", ")}`;
            return false;
        }
        return true;
    }
    function checkValidSettingBlackouts(organizerId, blackouts, dataBooking, organizerTz) {
        console.log("===== START checkValidSettingBlackouts =====");
        console.log("Organizer ID:", organizerId);
        console.log("Blackouts input:", blackouts);
        console.log("Data booking:", dataBooking);
        console.log("Organizer timezone:", organizerTz);
        // 1️⃣ Validasi input
        if (!organizerId || !blackouts || !dataBooking) {
            message.error = "All fields are required";
            console.log("❌ Validation failed: missing fields");
            return false;
        }
        if (!Array.isArray(blackouts)) {
            message.error = "Blackouts must be an array";
            console.log("❌ Validation failed: blackouts not an array");
            return false;
        }
        for (const date of blackouts) {
            console.log("Checking blackout date:", date);
            if (!date || typeof date !== "string") {
                message.error = `Invalid blackout date: ${date}`;
                console.log("❌ Invalid blackout date format");
                return false;
            }
            // Format YYYY-MM-DD
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(date)) {
                message.error = `Invalid date format: ${date}. Use YYYY-MM-DD`;
                console.log("❌ Invalid date regex check");
                return false;
            }
            // Valid date JS
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                message.error = `Invalid date: ${date}`;
                console.log("❌ Invalid JS date object");
                return false;
            }
        }
        // 2️⃣ Kalau blackouts kosong, lanjutkan saja
        if (blackouts.length === 0) {
            message.success = "No blackout dates, continue";
            console.log("✅ No blackout dates, valid");
            return { valid: true, message };
        }
        // 3️⃣ Konversi blackout ke UTC (full day)
        console.log("Converting blackout dates to UTC full-day ranges...");
        const blackoutRangesUTC = blackouts.map((dateStr) => {
            const startUTC = luxon_1.DateTime.fromISO(dateStr, { zone: organizerTz })
                .startOf("day")
                .toUTC();
            const endUTC = luxon_1.DateTime.fromISO(dateStr, { zone: organizerTz })
                .endOf("day")
                .toUTC();
            console.log(`- Blackout ${dateStr}: startUTC = ${startUTC.toISO()}, endUTC = ${endUTC.toISO()}`);
            return { startUTC, endUTC, dateStr };
        });
        // 4️⃣ Cek overlap dengan semua dataBooking
        console.log("Checking overlap with booked slots...");
        for (const booking of dataBooking) {
            console.log(`- Checking booking ID ${booking.slot_start_utc} (${booking.id})...`);
            const bookingStartUTC = luxon_1.DateTime.fromJSDate(booking.slot_start_utc).toUTC();
            const bookingEndUTC = luxon_1.DateTime.fromJSDate(booking.slot_end_utc).toUTC();
            console.log(`Booking ID ${booking.id} (${booking.name}): startUTC = ${bookingStartUTC.toISO()}, endUTC = ${bookingEndUTC.toISO()}`);
            for (const blackout of blackoutRangesUTC) {
                const overlap = bookingStartUTC < blackout.endUTC && bookingEndUTC > blackout.startUTC;
                console.log(`- Checking blackout ${blackout.dateStr} overlap: ${overlap}`);
                if (overlap) {
                    message.error = `Cannot set blackout on ${blackout.dateStr} because there's a booked meeting: ${booking.name} (ID: ${booking.id})`;
                    console.log("❌ Overlap detected! Cannot set blackout.");
                    return false;
                }
            }
        }
        message.success = "Blackouts are valid";
        console.log("✅ No overlaps found. Blackouts are valid.");
        console.log("===== END checkValidSettingBlackouts =====");
        return { valid: true, message };
    }
    // ✅ Semua valid
    return { checkValid, checkValidMeeting, checkValidSettingGeneral, checkValidSettingWorkingHours, checkValidSettingBlackouts, checkValidDuplication, message };
}
exports.default = validController;
