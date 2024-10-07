CREATE TABLE `country` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(256),
	`code` varchar(4),
	CONSTRAINT `country_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `country` (`name`);