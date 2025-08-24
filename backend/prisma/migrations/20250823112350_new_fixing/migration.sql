/*
  Warnings:

  - The primary key for the `UserCourse` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `purchasedAt` on the `UserCourse` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `UserCourse` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `UserCourse` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."UserCourse" DROP CONSTRAINT "UserCourse_pkey",
DROP COLUMN "purchasedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "UserCourse_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourse_userId_courseId_key" ON "public"."UserCourse"("userId", "courseId");
