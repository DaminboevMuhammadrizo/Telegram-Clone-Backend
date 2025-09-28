-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT;
