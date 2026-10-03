CREATE TABLE "minigame_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"slug" varchar(24) NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"last_score" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "minigame_scores" ADD CONSTRAINT "minigame_scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minigame_scores" ADD CONSTRAINT "minigame_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "minigame_scores_player_slug_idx" ON "minigame_scores" USING btree ("player_id","slug");--> statement-breakpoint
CREATE INDEX "minigame_scores_game_idx" ON "minigame_scores" USING btree ("game_id");