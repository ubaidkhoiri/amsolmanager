CREATE TYPE "public"."publication_status" AS ENUM('IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."timeline_category" AS ENUM('PREPARATION', 'MEETING', 'EVENT', 'LOGISTICS', 'PUBLICATION', 'D_DAY', 'POST_EVENT');--> statement-breakpoint
CREATE TYPE "public"."timeline_status" AS ENUM('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"division_id" uuid NOT NULL,
	"title" text NOT NULL,
	"channel" text DEFAULT '' NOT NULL,
	"format" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" "publication_status" DEFAULT 'IDEA' NOT NULL,
	"design_owner_id" uuid,
	"copy_owner_id" uuid,
	"asset_url" text,
	"published_url" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"cancel_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"division_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" timeline_category DEFAULT 'PREPARATION' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" timeline_status DEFAULT 'PLANNED' NOT NULL,
	"owner_member_id" uuid,
	"linked_task_id" uuid,
	"linked_publication_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_design_owner_id_members_id_fk" FOREIGN KEY ("design_owner_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_copy_owner_id_members_id_fk" FOREIGN KEY ("copy_owner_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_approved_by_members_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_owner_member_id_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;