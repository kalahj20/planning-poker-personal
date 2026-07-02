import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  votingScale: text("voting_scale").notNull().default("fibonacci"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

export const groupsTable = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => roomsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  currentStoryTitle: text("current_story_title"),
  revealed: boolean("revealed").notNull().default(false),
  round: integer("round").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;

// Participant groups (shown in the UI as "Groups"). This is a labelling layer
// on top of participants — everyone still votes together on the one shared
// `groups` (voting table) row; teams just organise who belongs to which group
// so votes can be displayed grouped on reveal.
export const teamsTable = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => roomsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("sky"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;

export const participantsTable = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => roomsTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => groupsTable.id, {
    onDelete: "set null",
  }),
  teamId: uuid("team_id").references(() => teamsTable.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  isSpectator: boolean("is_spectator").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(
  participantsTable,
).omit({ id: true, createdAt: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participantsTable.$inferSelect;

export const votesTable = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participantsTable.id, { onDelete: "cascade" }),
  storyId: uuid("story_id").references(() => storiesTable.id, {
    onDelete: "cascade",
  }),
  round: integer("round").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;

export const storiesTable = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  status: text("status").notNull().default("pending"),
  finalEstimate: text("final_estimate"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertStorySchema = createInsertSchema(storiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof storiesTable.$inferSelect;
