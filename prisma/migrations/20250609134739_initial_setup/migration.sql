/*
  Warnings:

  - You are about to alter the column `title` on the `Chat` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `scenarioKey` on the `Chat` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `feature` on the `Chat` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `type` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `role` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `auth_users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `is_active` on table `auth_users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_verified` on table `auth_users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "analytics_events" DROP CONSTRAINT "analytics_events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_sessions" DROP CONSTRAINT "learning_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "scenarioKey" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "feature" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "messageMetadata" JSONB,
ALTER COLUMN "role" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "auth_users" ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "is_verified" SET NOT NULL,
ALTER COLUMN "is_verified" SET DEFAULT false;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "learning_users" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "auth_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "last_active" TIMESTAMP(3),
    "total_interactions" INTEGER NOT NULL DEFAULT 0,
    "learning_level" VARCHAR(20) NOT NULL DEFAULT 'intermediate',
    "preferred_voice" VARCHAR(100),
    "settings" JSONB,

    CONSTRAINT "learning_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_users_session_id_key" ON "learning_users"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "learning_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "learning_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
