import { pgTable, varchar, integer, decimal, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const occupation = pgTable('occupation', {
  codeRome: varchar('code_rome', { length: 10 }).primaryKey(),
  titre: varchar('titre', { length: 255 }).notNull(),
  secteur: varchar('secteur', { length: 100 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const task = pgTable('task', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  occupationCodeRome: varchar('occupation_code_rome', { length: 10 }).notNull().references(() => occupation.codeRome),
  libelle: varchar('libelle', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationScore = pgTable('automation_score', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  taskId: integer('task_id').notNull().references(() => task.id),
  scorePct: decimal('score_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  horizon: varchar('horizon', { length: 10 }).notNull().default('now'), // 'now', '3y', '5y'
  source: varchar('source', { length: 20 }).default('default'), // 'default', 'manual', 'ai_calculated'
  analysis: text('analysis'), // Analyse détaillée de la tâche par le LLM
  reasoning: text('reasoning'), // Justification du score par le LLM
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userProfile = pgTable('user_profile', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userSimulation = pgTable('user_simulation', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: integer('user_id').references(() => userProfile.id),
  occupationCodeRome: varchar('occupation_code_rome', { length: 10 }).notNull().references(() => occupation.codeRome),
  jsonTempsParTache: text('json_temps_par_tache').notNull(), // JSON string with task_id -> hours mapping
  scoreGlobal: decimal('score_global', { precision: 5, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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