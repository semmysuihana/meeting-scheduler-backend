import express from "express";
import type { Request, Response } from "express";
// import pool from "./db";
import dotenv from "dotenv";
import validController from "./controller/validController";
import getData from "./controller/getData";
import manageData from "./controller/manageData";

import cors from "cors";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(cors());
app.use(express.json());



app.get("/", async (req: Request, res: Response) => {
  const { getDataMeeting } = getData();
  
  try {
    const result = await getDataMeeting();
    if (result.error) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/book/:id", async (req: Request, res: Response) => {
  const id: string = req.params.id;
   const { getDataMeetingById } = getData();
   try {
    const result = await getDataMeetingById(id);
    if (result.error) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});
app.get("/book/:id/booking", async (req: Request, res: Response) => {
  const id: string = req.params.id;
   const { getDataBooking } = getData();
   try {
    const result = await getDataBooking(id, "all");
    if (result.error) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/book/:status/:id/status", async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const status: string = req.params.status;
  const payload = req.body.payload;

  const { updateDataStatus } = manageData();
  const { getDataMeetingById, getDataBooking } = getData();
  const { checkValidMeeting, checkValidDuplication, message } = validController();

  try {
    if (!id || !status) return res.status(400).json({ error: "Invalid params" });

    // Jika status ingin diubah menjadi booked → lakukan pengecekan
    if (status === "booked") {

      // 1. Ambil data organizer
      const result = await getDataMeetingById(payload.organizer_id);
      if (result.error) return res.status(400).json({ error: result.error });
      if (!result.data || result.data.length === 0)
        return res.status(404).json({ error: "Organizer not found" });
      
      // 2. Validasi jam booking
      const resultValidMeeting = checkValidMeeting(
        result.data[0],
        payload.start_time_utc,
        payload.end_time_utc,
        payload.user_timezone
      );
      if (!resultValidMeeting)
        return res.status(400).json({ error: message.error });

      // 3. Cek apakah ada overlapping booking
      const resultBooking = await getDataBooking(payload.organizer_id, "");
      if (resultBooking.error)
        return res.status(400).json({ error: resultBooking.error });

      const isDuplicate = checkValidDuplication(
        resultBooking.data,
        payload.start_time_utc,
        payload.end_time_utc
      );
      if (!isDuplicate)
        return res.status(200).json({ error: message.error });
    }

    // JALANKAN UPDATE STATUS
    const numberId = Number(id);
    const result = await updateDataStatus(numberId, status);
    if (result.error) return res.status(200).json({ error: result.error });

    return res.status(200).json({ success: "Status updated", data: result });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


app.post("/book", async (req: Request, res: Response) => {
  const { organizer_id, name, email, start_time_utc, end_time_utc, user_timezone } = req.body;
  const { checkValid, checkValidMeeting, checkValidDuplication, message } = validController();
  const { getDataMeetingById, getDataBooking } = getData();
  const { insertData, resultInsert } = manageData();
  console.log(req.body);
  try {
    // 1️⃣ Validasi input dasar
    const validInput = checkValid(organizer_id, name, email, start_time_utc, end_time_utc, user_timezone);
    if (!validInput) return res.status(400).json({ error: message.error });

    // 2️⃣ Ambil data organizer dari DB
    const result = await getDataMeetingById(organizer_id);
    if (result.error) return res.status(400).json({ error: result.error });

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: "Organizer not found" });
    }

    const organizerData = result.data[0]; // ambil data pertama

    // 3️⃣ Validasi aturan meeting (working hours, blackout, double-booking, min notice)
    const validMeeting = checkValidMeeting(
      organizerData,
      start_time_utc,
      end_time_utc,
      user_timezone
    );
    if (!validMeeting) return res.status(200).json({ error: message.error });

    const resultBooking = await getDataBooking(organizer_id, "");
    if (resultBooking.error) return res.status(400).json({ error: resultBooking.error });

    const validDuplication = checkValidDuplication(
      resultBooking.data,
      start_time_utc,
      end_time_utc
    );
    if (!validDuplication) return res.status(200).json({ error: message.error });
    
    // 4️⃣ Simpan data ke DB
    
    const resultInsert = await insertData(organizer_id, name, email, start_time_utc, end_time_utc, user_timezone);
    if (resultInsert.error) return res.status(200).json({ error: resultInsert.error });
    console.log(resultInsert);
    // ✅ Semua validasi lulus
    return res.status(200).json({ success: resultInsert.success });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/settings/:edit/:id", async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const { name, working_hours, meeting_duration, buffer_before, buffer_after, min_notice_minutes, blackouts, timezone } = req.body;
  const { updateData, updateDataWorkingHours, updateDataBlackouts } = manageData();
  const { getDataMeetingById, getDataBooking } = getData();
  const {checkValidSettingWorkingHours, checkValidSettingBlackouts, checkValidSettingGeneral,  message } = validController();
  console.log('ini kiriman', req.body);
  try {
     const resultData = await getDataBooking(id, "");
     console.log("ini data booking",resultData.data);
     const numberId = Number(id);
    switch (req.params.edit) {
      case "general":
        
        const validSettingGeneral = checkValidSettingGeneral(numberId, name, meeting_duration, buffer_before, buffer_after, min_notice_minutes, timezone, resultData.data);
        if (!validSettingGeneral) return res.status(200).json({ error: message.error });

        const resultUpdate = await updateData(numberId, name, meeting_duration, buffer_before, buffer_after, min_notice_minutes, timezone);

        if (resultUpdate.error) return res.status(200).json({ error: resultUpdate.error });
        console.log(resultUpdate);
        return res.status(200).json({ success: resultUpdate.success });
        break;
      case "working_hours":
        const validSettingWorkingHours = checkValidSettingWorkingHours(id, working_hours, resultData.data);
        if (!validSettingWorkingHours) return res.status(200).json({ error: message.error });
        
        const resultUpdateWorkingHours = await updateDataWorkingHours(numberId, working_hours);
        if (resultUpdateWorkingHours.error) return res.status(200).json({ error: resultUpdateWorkingHours.error });
        console.log(resultUpdateWorkingHours);
        return res.status(200).json({ success: resultUpdateWorkingHours.success });
        break;
      case "blackouts":
        const validSettingBlackouts = checkValidSettingBlackouts(numberId, blackouts, resultData.data, timezone);
      
        if (!validSettingBlackouts) return res.status(200).json({ error: message.error });
        const resultUpdateBlackouts = await updateDataBlackouts(numberId, blackouts);
        if (resultUpdateBlackouts.error) return res.status(200).json({ error: resultUpdateBlackouts.error });
        console.log(resultUpdateBlackouts);
        return res.status(200).json({ success: resultUpdateBlackouts.success });
        break;
      default:
        return res.status(200).json({ error: "Invalid edit parameter" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


app.listen(PORT, "192.168.1.6", () => {
  console.log(`Server running at http://192.168.1.6:${PORT}`);
});

