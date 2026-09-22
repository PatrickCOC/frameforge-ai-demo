CREATE INDEX `idx_generation_jobs_project_created` ON `generation_jobs` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_projects_owner_created` ON `projects` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_scenes_project_position` ON `scenes` (`project_id`,`position`);