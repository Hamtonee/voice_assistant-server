/*
  Warnings:

  - A unique constraint covering the columns `[activeTokenId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "title" SET DEFAULT '"';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeTokenId" TEXT,
ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "lastActive" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_activeTokenId_key" ON "User"("activeTokenId");
