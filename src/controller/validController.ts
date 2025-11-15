import { DateTime, IANAZone } from "luxon";

interface Booking {
  start_time_utc: string;
  end_time_utc: string;
}

interface Blackout {
  start_time_utc: string;
  end_time_utc: string;
}

interface OrganizerData {
  working_hours: Record<string, string[]>; // {"Monday": ["09:00-17:00", "19:00-21:00"], ...}
  min_notice_minutes: number;
  blackouts: Blackout[];
  bookings: Booking[];
  meeting_duration: number;
  buffer_before: number;
  buffer_after: number;
  timezone: string;
}

function validController() {
  const message = { error: "", success: "" };

  // Validasi input dasar
  function checkValid(
    organizer_id: string,
    name: string,
    email: string,
    start_time_utc: string,
    end_time_utc: string,
    user_timezone: string
  ): boolean {
    if (!name || !email || !start_time_utc || !end_time_utc || !user_timezone) {
      message.error = "All fields are required";
      return false;
    }
    if (!email.includes("@")) {
      message.error = "Invalid email";
      return false;
    }
    if (!DateTime.fromISO(start_time_utc).isValid || !DateTime.fromISO(end_time_utc).isValid) {
      message.error = "Invalid start/end time format";
      return false;
    }
    if (start_time_utc >= end_time_utc) {
      message.error = "Start time must be before end time";
      return false;
    }
    if (!IANAZone.isValidZone(user_timezone)) {
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
  function checkValidMeeting(
    organizerData: OrganizerData,
    start_time_utc: string,
    end_time_utc: string,
    user_timezone: string
  ): boolean {
    const startUTC = DateTime.fromISO(start_time_utc, { zone: "utc" });
    const endUTC = DateTime.fromISO(end_time_utc, { zone: "utc" });
    const nowUTC = DateTime.now().toUTC();

    // Minimum notice
    if (startUTC < nowUTC.plus({ minutes: organizerData.min_notice_minutes })) {
      message.error = `Start time must be at least ${organizerData.min_notice_minutes} minutes in the future`;
      return false;
    }

    // Cek blackout
    // Misal blackout: ["2025-11-17", "2025-12-10"]
for (const blackoutDateStr of organizerData.blackouts) {
  // Buat DateTime di timezone organizer, jam 00:00
  const blackoutStart = DateTime.fromISO(blackoutDateStr, { zone: organizerData.timezone }).startOf("day").toUTC();
  const blackoutEnd = DateTime.fromISO(blackoutDateStr, { zone: organizerData.timezone }).endOf("day").toUTC();

  // cek overlap dengan slot user
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

if (
  hoursStr &&
  organizerData.meeting_duration &&
  organizerData.buffer_before != null &&
  organizerData.buffer_after != null &&
  organizerData.min_notice_minutes != null
) {
  const [wStart, wEnd] = hoursStr.split("-");
  console.log("Parsed working hours:", { wStart, wEnd });

  // Build wStartUTC dan wEndUTC berdasarkan tanggal startUTC
  let wStartUTC = DateTime.fromObject(
    {
      year: startDateInOrganizerTZ.year,
      month: startDateInOrganizerTZ.month,
      day: startDateInOrganizerTZ.day,
      hour: parseInt(wStart.split(":")[0]),
      minute: parseInt(wStart.split(":")[1]),
      second: 0,
    },
    { zone: organizerData.timezone }
  ).toUTC();

  let wEndUTC = DateTime.fromObject(
    {
      year: startDateInOrganizerTZ.year,
      month: startDateInOrganizerTZ.month,
      day: startDateInOrganizerTZ.day,
      hour: parseInt(wEnd.split(":")[0]),
      minute: parseInt(wEnd.split(":")[1]),
      second: 0,
    },
    { zone: organizerData.timezone }
  ).toUTC();

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
    } else {
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

function isTimeOverlap(startA: DateTime, endA: DateTime, startB: DateTime, endB: DateTime) {
  const overlap = startA < endB && endA > startB;
  console.log("Checking overlap:");
  console.log("  Slot A:", startA.toISO(), "-", endA.toISO());
  console.log("  Slot B:", startB.toISO(), "-", endB.toISO());
  console.log("  Overlap result:", overlap);
  return overlap;
}

function checkValidDuplication(bookings: any[], start_time_utc: string, end_time_utc: string) {

  // Pastikan start/end user selalu DateTime
  const startUTC = DateTime.fromISO(start_time_utc);
  const endUTC = DateTime.fromISO(end_time_utc);

  console.log("==== START DUPLICATION CHECK ====");
  console.log("User slot UTC:", startUTC.toISO(), "-", endUTC.toISO());
  console.log("Existing bookings count:", bookings.length);

  for (const [idx, booking] of bookings.entries()) {
    // Aman: bisa string ISO atau Date object
    let bookingStart: DateTime;
    let bookingEnd: DateTime;

    if (typeof booking.slot_start_utc === "string") {
      bookingStart = DateTime.fromISO(booking.slot_start_utc);
    } else if (booking.slot_start_utc instanceof Date) {
      bookingStart = DateTime.fromJSDate(booking.slot_start_utc);
    } else {
      console.warn(`[Booking ${idx + 1}] Invalid start time format:`, booking.slot_start_utc);
      continue;
    }

    if (typeof booking.slot_end_utc === "string") {
      bookingEnd = DateTime.fromISO(booking.slot_end_utc);
    } else if (booking.slot_end_utc instanceof Date) {
      bookingEnd = DateTime.fromJSDate(booking.slot_end_utc);
    } else {
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
    } else {
      console.log("✅ No overlap with this booking.");
    }
  }

  message.success = "Slot is valid";
  console.log("✅ No duplication found. Slot is valid.");
  console.log("==== END DUPLICATION CHECK ====");
  return true;
}


  return { checkValid, checkValidMeeting, checkValidDuplication, message };
}

export default validController;
