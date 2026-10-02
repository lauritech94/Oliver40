import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { TaskMeta } from "../lib/types";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  name: text("name").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("running"),
  planVersion: varchar("plan_version", { length: 32 }).notNull().default(""),
  /** Nº de tarjetas NFC físicas: 420, una por prueba de la partida fija. */
  cardPoolSize: integer("card_pool_size").notNull().default(420),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
});

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: varchar("emoji", { length: 8 }).notNull().default("🙂"),
    token: varchar("token", { length: 40 }).notNull().unique(),
    /** Puesto fijo J01…J28 según la lista oficial del juego. */
    slot: integer("slot").notNull().default(0),
    /** Ficha personal: otros jugadores tienen que averiguar estos datos. */
    profile: jsonb("profile").$type<Record<string, string>>().notNull().default({}),
    currentStep: integer("current_step").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("players_game_idx").on(table.gameId),
    uniqueIndex("players_game_slot_idx").on(table.gameId, table.slot),
  ],
);

/**
 * Una fila = una prueba concreta, de un jugador, en una posición del recorrido,
 * vinculada a UNA tarjeta NFC que nadie más tiene en esta partida.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(),
    cardNumber: integer("card_number").notNull(),
    typeSlug: varchar("type_slug", { length: 40 }).notNull(),
    typeName: text("type_name").notNull(),
    icon: varchar("icon", { length: 8 }).notNull().default("🎯"),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer").notNull(),
    hint: text("hint").notNull().default(""),
    judgeNote: text("judge_note").notNull().default(""),
    requiresJudge: boolean("requires_judge").notNull().default(false),
    needsSetup: boolean("needs_setup").notNull().default(false),
    meta: jsonb("meta").$type<TaskMeta>().notNull().default({}),
    attempts: integer("attempts").notNull().default(0),
    peeks: integer("peeks").notNull().default(0),
    hintUsed: boolean("hint_used").notNull().default(false),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    solvedByJudge: boolean("solved_by_judge").notNull().default(false),
  },
  (table) => [
    uniqueIndex("tasks_game_card_idx").on(table.gameId, table.cardNumber),
    uniqueIndex("tasks_player_step_idx").on(table.playerId, table.stepIndex),
  ],
);

export type Game = typeof games.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Task = typeof tasks.$inferSelect;
