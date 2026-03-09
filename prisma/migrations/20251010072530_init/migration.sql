/*
  Warnings:

  - You are about to drop the column `licenseCodes` on the `plan` table. All the data in the column will be lost.
  - Added the required column `license_id` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `plan` DROP COLUMN `licenseCodes`,
    ADD COLUMN `license_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Plan` ADD CONSTRAINT `Plan_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
