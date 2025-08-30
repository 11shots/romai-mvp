CREATE TABLE `automation_score` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`score_pct` real DEFAULT 0 NOT NULL,
	`horizon` text DEFAULT 'now' NOT NULL,
	`source` text DEFAULT 'default',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `occupation` (
	`code_rome` text PRIMARY KEY NOT NULL,
	`titre` text NOT NULL,
	`secteur` text,
	`description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occupation_code_rome` text NOT NULL,
	`libelle` text NOT NULL,
	`description` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`occupation_code_rome`) REFERENCES `occupation`(`code_rome`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_email_unique` ON `user_profile` (`email`);--> statement-breakpoint
CREATE TABLE `user_simulation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`occupation_code_rome` text NOT NULL,
	`json_temps_par_tache` text NOT NULL,
	`score_global` real DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`occupation_code_rome`) REFERENCES `occupation`(`code_rome`) ON UPDATE no action ON DELETE no action
);
