CREATE TABLE `banks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(256),
	`country_id` bigint,
	CONSTRAINT `banks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(256),
	`bank_id` bigint,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `banks` ADD CONSTRAINT `banks_country_id_country_id_fk` FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `branches` ADD CONSTRAINT `branches_bank_id_banks_id_fk` FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `name_idx` ON `banks` (`name`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `branches` (`name`);