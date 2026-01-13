CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`sub` varchar(255),
	`name` varchar(255),
	`avatar` text,
	`email` varchar(255) NOT NULL,
	`last_login_ip` varchar(45),
	`last_login_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`is_active` boolean DEFAULT true,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
