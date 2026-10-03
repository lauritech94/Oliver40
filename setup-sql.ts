/**
 * SQL de instalación, embebido para poder ejecutarlo desde el navegador
 * (en un despliegue serverless no se puede leer la carpeta ./drizzle con fiabilidad).
 *
 * Es idempotente: se puede lanzar las veces que haga falta sin romper nada.
 * Debe mantenerse sincronizado con src/db/schema.ts.
 */
export const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS "games" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(8) NOT NULL,
  "name" text NOT NULL,
  "status" varchar(16) DEFAULT 'running' NOT NULL,
  "plan_version" varchar(32) DEFAULT '' NOT NULL,
  "card_pool_size" integer DEFAULT 420 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  CONSTRAINT "games_code_unique" UNIQUE("code")
);

CREATE TABLE IF NOT EXISTS "players" (
  "id" serial PRIMARY KEY NOT NULL,
  "game_id" integer NOT NULL,
  "name" text NOT NULL,
  "emoji" varchar(8) DEFAULT '🙂' NOT NULL,
  "token" varchar(40) NOT NULL,
  "slot" integer DEFAULT 0 NOT NULL,
  "profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "current_step" integer DEFAULT 0 NOT NULL,
  "started_at" timestamp with time zone,
  "finished_at" timestamp with time zone,
  CONSTRAINT "players_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "game_id" integer NOT NULL,
  "player_id" integer NOT NULL,
  "step_index" integer NOT NULL,
  "card_number" integer NOT NULL,
  "type_slug" varchar(40) NOT NULL,
  "type_name" text NOT NULL,
  "icon" varchar(8) DEFAULT '🎯' NOT NULL,
  "title" text NOT NULL,
  "prompt" text NOT NULL,
  "answer" text NOT NULL,
  "hint" text DEFAULT '' NOT NULL,
  "judge_note" text DEFAULT '' NOT NULL,
  "requires_judge" boolean DEFAULT false NOT NULL,
  "needs_setup" boolean DEFAULT false NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "peeks" integer DEFAULT 0 NOT NULL,
  "hint_used" boolean DEFAULT false NOT NULL,
  "opened_at" timestamp with time zone,
  "solved_at" timestamp with time zone,
  "solved_by_judge" boolean DEFAULT false NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_game_id_games_id_fk') THEN
    ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk"
      FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_game_id_games_id_fk') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_game_id_games_id_fk"
      FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_player_id_players_id_fk') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_player_id_players_id_fk"
      FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "players_game_idx" ON "players" USING btree ("game_id");
CREATE UNIQUE INDEX IF NOT EXISTS "players_game_slot_idx" ON "players" USING btree ("game_id","slot");
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_game_card_idx" ON "tasks" USING btree ("game_id","card_number");
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_player_step_idx" ON "tasks" USING btree ("player_id","step_index");

CREATE TABLE IF NOT EXISTS "minigame_scores" (
  "id" serial PRIMARY KEY NOT NULL,
  "game_id" integer NOT NULL,
  "player_id" integer NOT NULL,
  "slug" varchar(24) NOT NULL,
  "best_score" integer DEFAULT 0 NOT NULL,
  "last_score" integer DEFAULT 0 NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minigame_scores_game_id_games_id_fk') THEN
    ALTER TABLE "minigame_scores" ADD CONSTRAINT "minigame_scores_game_id_games_id_fk"
      FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minigame_scores_player_id_players_id_fk') THEN
    ALTER TABLE "minigame_scores" ADD CONSTRAINT "minigame_scores_player_id_players_id_fk"
      FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "minigame_scores_player_slug_idx" ON "minigame_scores" USING btree ("player_id","slug");
CREATE INDEX IF NOT EXISTS "minigame_scores_game_idx" ON "minigame_scores" USING btree ("game_id");
`;
