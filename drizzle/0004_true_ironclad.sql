ALTER TABLE `collaborations` DROP FOREIGN KEY `collaborations_email_users_email_fk`;
--> statement-breakpoint
ALTER TABLE `collaborations` DROP COLUMN `is_pending`;