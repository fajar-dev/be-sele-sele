CREATE TABLE `pages` (
	`id` varchar(36) NOT NULL,
	`icon` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`)
);
