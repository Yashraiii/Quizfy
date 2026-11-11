/*
  Warnings:

  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ParticipantAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantAnswer" DROP CONSTRAINT "ParticipantAnswer_participantId_fkey";

-- DropTable
DROP TABLE "Participant";

-- DropTable
DROP TABLE "ParticipantAnswer";
