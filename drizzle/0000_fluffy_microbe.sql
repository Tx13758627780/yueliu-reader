CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`article` text NOT NULL,
	`data` text NOT NULL,
	`audio` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_owner_article` ON `notes` (`owner`,`article`);