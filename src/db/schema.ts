import { mysqlTable, varchar, int, decimal, text, timestamp } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const occupation = mysqlTable('occupation', {
  codeRome: varchar('code_rome', { length: 10 }).primaryKey(),
  titre: varchar('titre', { length: 255 }).notNull(),
  secteur: varchar('secteur', { length: 100 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const task = mysqlTable('task', {
  id: int('id').primaryKey().autoincrement(),
  occupationCodeRome: varchar('occupation_code_rome', { length: 10 }).notNull().references(() => occupation.codeRome),
  libelle: varchar('libelle', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const automationScore = mysqlTable('automation_score', {
  id: int('id').primaryKey().autoincrement(),
  taskId: int('task_id').notNull().references(() => task.id),
  scorePct: decimal('score_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  horizon: varchar('horizon', { length: 10 }).notNull().default('now'), // 'now', '3y', '5y'
  source: varchar('source', { length: 20 }).default('default'), // 'default', 'manual', 'ai_calculated'
  analysis: text('analysis'), // Analyse détaillée de la tâche par le LLM
  reasoning: text('reasoning'), // Justification du score par le LLM
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const userProfile = mysqlTable('user_profile', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const userSimulation = mysqlTable('user_simulation', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').references(() => userProfile.id),
  occupationCodeRome: varchar('occupation_code_rome', { length: 10 }).notNull().references(() => occupation.codeRome),
  jsonTempsParTache: text('json_temps_par_tache').notNull(), // JSON string with task_id -> hours mapping
  scoreGlobal: decimal('score_global', { precision: 5, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
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