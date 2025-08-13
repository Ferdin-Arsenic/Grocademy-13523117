-- CreateTable
CREATE TABLE "public"."UserCourse" (
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCourse_pkey" PRIMARY KEY ("userId","courseId")
);

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
