CREATE TABLE `automation_score` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_id` int NOT NULL,
	`score_pct` decimal(5,2) NOT NULL DEFAULT '0',
	`horizon` varchar(10) NOT NULL DEFAULT 'now',
	`source` varchar(20) DEFAULT 'default',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_score_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occupation` (
	`code_rome` varchar(10) NOT NULL,
	`titre` varchar(255) NOT NULL,
	`secteur` varchar(100),
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occupation_code_rome` PRIMARY KEY(`code_rome`)
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` int AUTO_INCREMENT NOT NULL,
	`occupation_code_rome` varchar(10) NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profile_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_simulation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`occupation_code_rome` varchar(10) NOT NULL,
	`json_temps_par_tache` text NOT NULL,
	`score_global` decimal(5,2) NOT NULL DEFAULT '0',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_simulation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `automation_score` ADD CONSTRAINT `automation_score_task_id_task_id_fk` FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_occupation_code_rome_occupation_code_rome_fk` FOREIGN KEY (`occupation_code_rome`) REFERENCES `occupation`(`code_rome`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_simulation` ADD CONSTRAINT `user_simulation_user_id_user_profile_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_simulation` ADD CONSTRAINT `user_simulation_occupation_code_rome_occupation_code_rome_fk` FOREIGN KEY (`occupation_code_rome`) REFERENCES `occupation`(`code_rome`) ON DELETE no action ON UPDATE no action;