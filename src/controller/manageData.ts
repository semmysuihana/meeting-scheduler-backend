import pool from "./../db.ts";
function manageData(){
    let resultInsert = {data: [], error: "", success: ""};

    async function insertData(organizer_id, name, email, start_time_utc, end_time_utc, user_timezone){
        const query = `
        INSERT INTO booking (organizer_id, name, email, slot_start_utc, slot_end_utc, user_timezone, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        `;
        try {
            const results = await pool.query(query, [organizer_id, name, email, start_time_utc, end_time_utc, user_timezone, "booked"]);
            resultInsert.data = results.rows[0];
            resultInsert.success = "Success to insert data";
        } catch (error) {
            console.error(error);
            resultInsert.error = "Failed to insert data";
        }
        return resultInsert;
    }
        return { insertData, resultInsert };
}
export default manageData