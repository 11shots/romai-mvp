import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const occupation = sqliteTable('occupation', {
  codeRome: text('code_rome').primaryKey(),
  titre: text('titre').notNull(),
  secteur: text('secteur'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const task = sqliteTable('task', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  occupationCodeRome: text('occupation_code_rome').notNull().references(() => occupation.codeRome),
  libelle: text('libelle').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const automationScore = sqliteTable('automation_score', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => task.id),
  scorePct: real('score_pct').notNull().default(0),
  horizon: text('horizon').notNull().default('now'), // 'now', '3y', '5y'
  source: text('source').default('default'), // 'default', 'manual', 'ai_calculated'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userSimulation = sqliteTable('user_simulation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => userProfile.id),
  occupationCodeRome: text('occupation_code_rome').notNull().references(() => occupation.codeRome),
  jsonTempsParTache: text('json_temps_par_tache').notNull(), // JSON string with task_id -> hours mapping
  scoreGlobal: real('score_global').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Relations
export const occupationRelations = relations(occupation, ({ many }) => ({
  tasks: many(task),
  simulations: many(userSimulation),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  occupation: one(occupation, {
    fields: [task.occupationCodeRome],
    references: [occupation.codeRome],
  }),
  automationScores: many(automationScore),
}));

export const automationScoreRelations = relations(automationScore, ({ one }) => ({
  task: one(task, {
    fields: [automationScore.taskId],
    references: [task.id],
  }),
}));

export const userProfileRelations = relations(userProfile, ({ many }) => ({
  simulations: many(userSimulation),
}));

export const userSimulationRelations = relations(userSimulation, ({ one }) => ({
  user: one(userProfile, {
    fields: [userSimulation.userId],
    references: [userProfile.id],
  }),
  occupation: one(occupation, {
    fields: [userSimulation.occupationCodeRome],
    references: [occupation.codeRome],
  }),
}));

// Types
export type Occupation = typeof occupation.$inferSelect;
export type Task = typeof task.$inferSelect;
export type AutomationScore = typeof automationScore.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type UserSimulation = typeof userSimulation.$inferSelect;

export type NewOccupation = typeof occupation.$inferInsert;
export type NewTask = typeof task.$inferInsert;
export type NewAutomationScore = typeof automationScore.$inferInsert;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type NewUserSimulation = typeof userSimulation.$inferInsert;