CREATE TABLE "login" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"useremail" text,
	"wallet_address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "login_username_unique" UNIQUE("username"),
	CONSTRAINT "login_useremail_unique" UNIQUE("useremail"),
	CONSTRAINT "login_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "userpath" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"wallet_address" text,
	"path" jsonb[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "userpolygon" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"wallet_address" text,
	"polygon" jsonb[] DEFAULT '{}'
);
--> statement-breakpoint
ALTER TABLE "userpath" ADD CONSTRAINT "userpath_username_login_username_fk" FOREIGN KEY ("username") REFERENCES "public"."login"("username") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userpath" ADD CONSTRAINT "userpath_wallet_address_login_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."login"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userpolygon" ADD CONSTRAINT "userpolygon_username_login_username_fk" FOREIGN KEY ("username") REFERENCES "public"."login"("username") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userpolygon" ADD CONSTRAINT "userpolygon_wallet_address_login_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."login"("wallet_address") ON DELETE no action ON UPDATE no action;