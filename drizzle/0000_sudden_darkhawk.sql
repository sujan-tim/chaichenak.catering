CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`reference` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`occasion` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text,
	`venue` text NOT NULL,
	`guests` integer NOT NULL,
	`budget` integer,
	`menu` text NOT NULL,
	`message` text NOT NULL,
	`consent_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inquiries_reference_unique` ON `inquiries` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_inquiries_status_created` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expiry` ON `rate_limits` (`expires_at`);