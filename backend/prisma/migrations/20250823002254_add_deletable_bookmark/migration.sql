-- DropForeignKey
ALTER TABLE "public"."UserCourseBookmark" DROP CONSTRAINT "UserCourseBookmark_courseId_fkey";

-- AddForeignKey
ALTER TABLE "public"."UserCourseBookmark" ADD CONSTRAINT "UserCourseBookmark_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
