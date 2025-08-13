-- CreateTable
CREATE TABLE "public"."UserModuleCompletion" (
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModuleCompletion_pkey" PRIMARY KEY ("userId","moduleId")
);

-- AddForeignKey
ALTER TABLE "public"."UserModuleCompletion" ADD CONSTRAINT "UserModuleCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserModuleCompletion" ADD CONSTRAINT "UserModuleCompletion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
