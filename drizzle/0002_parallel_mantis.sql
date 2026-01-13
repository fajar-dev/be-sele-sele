CREATE TABLE `collaborations` (
	`id` varchar(36) NOT NULL,
	`page_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`is_pending` boolean DEFAULT true,
	`is_owner` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collaborations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `collaborations` ADD CONSTRAINT `collaborations_page_id_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collaborations` ADD CONSTRAINT `collaborations_email_users_email_fk` FOREIGN KEY (`email`) REFERENCES `users`(`email`) ON DELETE no action ON UPDATE no action;