-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "activeTokenId" VARCHAR(255),
ADD COLUMN     "deviceInfo" VARCHAR(255),
ADD COLUMN     "lastActive" TIMESTAMP(3);
