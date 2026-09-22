import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style").notNull(),
  duration: integer("duration").notNull(),
  ratio: text("ratio").notNull(),
  motion: integer("motion").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("idx_projects_owner_created").on(table.ownerId, table.createdAt)]);

export const scenes = sqliteTable("scenes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  startSecond: integer("start_second").notNull(),
  endSecond: integer("end_second").notNull(),
  prompt: text("prompt").notNull(),
}, (table) => [index("idx_scenes_project_position").on(table.projectId, table.position)]);

export const generationJobs = sqliteTable("generation_jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull(),
  readyAt: integer("ready_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("idx_generation_jobs_project_created").on(table.projectId, table.createdAt)]);
