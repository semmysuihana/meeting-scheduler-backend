-- CreateTable
CREATE TABLE "booking" (
    "id" SERIAL NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "slot_start_utc" TIMESTAMPTZ(6) NOT NULL,
    "slot_end_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT DEFAULT 'booked',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_timezone" VARCHAR,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "working_hours" JSONB NOT NULL,
    "meeting_duration" INTEGER NOT NULL,
    "buffer_before" INTEGER DEFAULT 0,
    "buffer_after" INTEGER DEFAULT 0,
    "min_notice_minutes" INTEGER DEFAULT 60,
    "blackouts" JSONB DEFAULT '[]',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_booking_organizer_time" ON "booking"("organizer_id", "slot_start_utc");

-- CreateIndex
CREATE UNIQUE INDEX "settings_organizer_id_key" ON "settings"("organizer_id");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

