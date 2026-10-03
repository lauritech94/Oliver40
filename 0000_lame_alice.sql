CREATE TABLE "games" (
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
--> statement-breakpoint
CREATE TABLE "players" (
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
--> statement-breakpoint
CREATE TABLE "tasks" (
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
--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "players_game_idx" ON "players" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_game_slot_idx" ON "players" USING btree ("game_id","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_game_card_idx" ON "tasks" USING btree ("game_id","card_number");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_player_step_idx" ON "tasks" USING btree ("player_id","step_index");