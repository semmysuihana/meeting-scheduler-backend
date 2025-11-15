import express from "express";
import type { Request, Response } from "express";
// import pool from "./db";
import dotenv from "dotenv";
import pool from "./db.ts";
import validController from "./controller/validController.ts";
import getData from "./controller/getData.ts";
import manageData from "./controller/manageData.ts";

import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 3000;

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

    const resultBooking = await getDataBooking(organizer_id);
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

app.listen(PORT, "192.168.1.6", () => {
  console.log(`✅ Server running at http://192.168.1.6:${PORT}`);
});

