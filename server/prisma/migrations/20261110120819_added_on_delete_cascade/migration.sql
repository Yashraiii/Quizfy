-- DropForeignKey
ALTER TABLE "LiveSession" DROP CONSTRAINT "LiveSession_quizId_fkey";

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
