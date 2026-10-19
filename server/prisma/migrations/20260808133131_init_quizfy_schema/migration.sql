/*
  Warnings:

  - The values [SHORT_ANSWER] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ARCHIVED] on the enum `QuizStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_PROGRESS,ENDED] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `negativeMarking` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `randomize` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `timeLimit` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attempt` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionId,displayName]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('MCQ', 'MULTI_CORRECT', 'TRUE_FALSE');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "QuizStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."Quiz" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Quiz" ALTER COLUMN "status" TYPE "QuizStatus_new" USING ("status"::text::"QuizStatus_new");
ALTER TYPE "QuizStatus" RENAME TO "QuizStatus_old";
ALTER TYPE "QuizStatus_new" RENAME TO "QuizStatus";
DROP TYPE "public"."QuizStatus_old";
ALTER TABLE "Quiz" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('LOBBY', 'QUESTION_ACTIVE', 'QUESTION_ENDED', 'LEADERBOARD', 'FINISHED');
ALTER TABLE "public"."LiveSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "LiveSession" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "LiveSession" ALTER COLUMN "status" SET DEFAULT 'LOBBY';
COMMIT;

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantAnswer" DROP CONSTRAINT "ParticipantAnswer_participantId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantAnswer" DROP CONSTRAINT "ParticipantAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- DropIndex
DROP INDEX "Participant_sessionId_userId_key";

-- DropIndex
DROP INDEX "Question_difficulty_idx";

-- DropIndex
DROP INDEX "Question_topic_idx";

-- DropIndex
DROP INDEX "QuizQuestion_questionId_idx";

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "description",
DROP COLUMN "difficulty",
DROP COLUMN "source",
DROP COLUMN "status",
DROP COLUMN "tags",
DROP COLUMN "topic",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "timeLimit" INTEGER NOT NULL DEFAULT 20,
ALTER COLUMN "type" SET DEFAULT 'MCQ';

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "negativeMarking",
DROP COLUMN "randomize",
DROP COLUMN "timeLimit";

-- AlterTable
ALTER TABLE "QuizQuestion" DROP COLUMN "marks",
ADD COLUMN     "order" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "Attempt";

-- DropEnum
DROP TYPE "AttemptStatus";

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "QuestionSource";

-- DropEnum
DROP TYPE "QuestionStatus";

-- CreateIndex
CREATE INDEX "LiveSession_roomCode_idx" ON "LiveSession"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_sessionId_displayName_key" ON "Participant"("sessionId", "displayName");

-- CreateIndex
CREATE INDEX "ParticipantAnswer_participantId_idx" ON "ParticipantAnswer"("participantId");

-- CreateIndex
CREATE INDEX "Question_creatorId_idx" ON "Question"("creatorId");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAnswer" ADD CONSTRAINT "ParticipantAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
