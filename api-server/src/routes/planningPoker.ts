import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  db,
  roomsTable,
  groupsTable,
  teamsTable,
  participantsTable,
  votesTable,
  storiesTable,
  type Group,
  type Participant,
} from "@workspace/db";
import {
  CreateRoomBody,
  CreateRoomResponse,
  GetRoomStateParams,
  GetRoomStateResponse,
  JoinRoomParams,
  JoinRoomBody,
  JoinRoomResponse,
  CreateGroupParams,
  CreateGroupBody,
  CreateGroupResponse,
  UpdateGroupParams,
  UpdateGroupBody,
  UpdateGroupResponse,
  DeleteGroupParams,
  RevealGroupVotesParams,
  RevealGroupVotesResponse,
  ResetGroupVotesParams,
  ResetGroupVotesResponse,
  CastVoteParams,
  CastVoteBody,
  CastVoteResponse,
  UpdateParticipantParams,
  UpdateParticipantBody,
  UpdateParticipantResponse,
  LeaveRoomParams,
  ImportStoriesParams,
  ImportStoriesBody,
  ImportStoriesResponse,
  StartStoryParams,
  StartStoryResponse,
  GetStoryVotesParams,
  GetStoryVotesResponse,
  DeleteStoryParams,
  CreateTeamParams,
  CreateTeamBody,
  CreateTeamResponse,
  UpdateTeamParams,
  UpdateTeamBody,
  UpdateTeamResponse,
  DeleteTeamParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MAX_PARTICIPANTS = 20;

const TEAM_COLORS = [
  "sky",
  "rose",
  "amber",
  "emerald",
  "violet",
  "pink",
  "teal",
];

function generateRoomKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 6; i++) {
    key += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return key;
}

function computeStats(values: string[]): {
  average: number | null;
  allSame: boolean;
} {
  const numeric = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  const average =
    numeric.length > 0
      ? Math.round(
          (numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10,
        ) / 10
      : null;
  const allSame = values.length > 0 && values.every((v) => v === values[0]);
  return { average, allSame };
}

async function serializeGroup(group: Group) {
  const participants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.groupId, group.id));

  const votes = await db
    .select()
    .from(votesTable)
    .where(and(eq(votesTable.groupId, group.id), eq(votesTable.round, group.round)));

  const voteByParticipant = new Map(votes.map((v) => [v.participantId, v.value]));

  const participantStates = participants.map((p) => {
    const voteValue = voteByParticipant.get(p.id) ?? null;
    return {
      id: p.id,
      name: p.name,
      isSpectator: p.isSpectator,
      hasVoted: voteValue != null,
      voteValue: group.revealed ? voteValue : null,
      teamId: p.teamId,
    };
  });

  const votingValues = participants
    .filter((p) => !p.isSpectator)
    .map((p) => voteByParticipant.get(p.id))
    .filter((v): v is string => v != null);

  const stats = group.revealed
    ? computeStats(votingValues)
    : { average: null, allSame: false };

  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.groupId, group.id))
    .orderBy(storiesTable.order);

  const activeStory = stories.find((s) => s.status === "active") ?? null;

  return {
    id: group.id,
    roomId: group.roomId,
    name: group.name,
    currentStoryTitle: group.currentStoryTitle,
    activeStoryId: activeStory?.id ?? null,
    revealed: group.revealed,
    round: group.round,
    average: stats.average,
    allSame: stats.allSame,
    participants: participantStates,
    backlog: stories.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      title: s.title,
      order: s.order,
      status: s.status,
      finalEstimate: s.finalEstimate,
    })),
  };
}

function serializeParticipantState(p: Participant) {
  return {
    id: p.id,
    name: p.name,
    isSpectator: p.isSpectator,
    hasVoted: false,
    voteValue: null,
    teamId: p.teamId,
  };
}

router.post("/rooms", async (req, res): Promise<void> => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let key = generateRoomKey();
  for (let attempts = 0; attempts < 5; attempts++) {
    const [existing] = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.key, key));
    if (!existing) break;
    key = generateRoomKey();
  }

  const [room] = await db
    .insert(roomsTable)
    .values({
      key,
      name: parsed.data.name,
      votingScale: parsed.data.votingScale ?? "fibonacci",
    })
    .returning();

  // Every room gets a single shared voting table, created automatically.
  await db.insert(groupsTable).values({ roomId: room.id, name: "Main" });

  res.status(201).json(CreateRoomResponse.parse(room));
});

router.get("/rooms/:key", async (req, res): Promise<void> => {
  const params = GetRoomStateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.key, params.data.key));

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const groups = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.roomId, room.id));

  const groupStates = await Promise.all(groups.map(serializeGroup));

  const teams = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.roomId, room.id))
    .orderBy(teamsTable.order);

  const unassignedParticipants = await db
    .select()
    .from(participantsTable)
    .where(
      and(
        eq(participantsTable.roomId, room.id),
        isNull(participantsTable.groupId),
      ),
    );

  const allParticipants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.roomId, room.id));

  res.json(
    GetRoomStateResponse.parse({
      room,
      groups: groupStates,
      teams,
      unassigned: unassignedParticipants.map(serializeParticipantState),
      participantCount: allParticipants.length,
      maxParticipants: MAX_PARTICIPANTS,
    }),
  );
});

router.post("/rooms/:key/join", async (req, res): Promise<void> => {
  const params = JoinRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = JoinRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.key, params.data.key));

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const existing = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.roomId, room.id));

  if (existing.length >= MAX_PARTICIPANTS) {
    res
      .status(400)
      .json({ error: `This room is full (max ${MAX_PARTICIPANTS} people).` });
    return;
  }

  // Every room has a single shared voting table; new participants join it automatically.
  const [defaultGroup] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.roomId, room.id));

  const [participant] = await db
    .insert(participantsTable)
    .values({
      roomId: room.id,
      name: parsed.data.name,
      isSpectator: parsed.data.isSpectator ?? false,
      groupId: defaultGroup?.id ?? null,
    })
    .returning();

  res.status(201).json(JoinRoomResponse.parse(participant));
});

router.post("/rooms/:key/groups", async (req, res): Promise<void> => {
  const params = CreateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.key, params.data.key));

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const [group] = await db
    .insert(groupsTable)
    .values({ roomId: room.id, name: parsed.data.name })
    .returning();

  res.status(201).json(CreateGroupResponse.parse(await serializeGroup(group)));
});

router.patch("/groups/:id", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const updates: Partial<typeof groupsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name;
  }
  if (parsed.data.currentStoryTitle !== undefined) {
    updates.currentStoryTitle = parsed.data.currentStoryTitle;
    updates.revealed = false;
    updates.round = existing.round + 1;
  }

  const [group] = await db
    .update(groupsTable)
    .set(updates)
    .where(eq(groupsTable.id, params.data.id))
    .returning();

  res.json(UpdateGroupResponse.parse(await serializeGroup(group)));
});

router.delete("/groups/:id", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db
    .delete(groupsTable)
    .where(eq(groupsTable.id, params.data.id))
    .returning();

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/groups/:id/reveal", async (req, res): Promise<void> => {
  const params = RevealGroupVotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const [group] = await db
    .update(groupsTable)
    .set({ revealed: true })
    .where(eq(groupsTable.id, params.data.id))
    .returning();

  res.json(RevealGroupVotesResponse.parse(await serializeGroup(group)));
});

router.post("/groups/:id/reset", async (req, res): Promise<void> => {
  const params = ResetGroupVotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const [group] = await db
    .update(groupsTable)
    .set({ revealed: false, round: existing.round + 1 })
    .where(eq(groupsTable.id, params.data.id))
    .returning();

  res.json(ResetGroupVotesResponse.parse(await serializeGroup(group)));
});

router.post("/groups/:id/vote", async (req, res): Promise<void> => {
  const params = CastVoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CastVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const [participant] = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.id, parsed.data.participantId));

  if (!participant || participant.groupId !== group.id) {
    res.status(404).json({ error: "Participant not found in this group" });
    return;
  }

  const [activeStory] = await db
    .select()
    .from(storiesTable)
    .where(
      and(
        eq(storiesTable.groupId, group.id),
        eq(storiesTable.status, "active"),
      ),
    );

  const [existingVote] = await db
    .select()
    .from(votesTable)
    .where(
      and(
        eq(votesTable.groupId, group.id),
        eq(votesTable.participantId, participant.id),
        eq(votesTable.round, group.round),
      ),
    );

  if (existingVote) {
    await db
      .update(votesTable)
      .set({ value: parsed.data.value, storyId: activeStory?.id ?? null })
      .where(eq(votesTable.id, existingVote.id));
  } else {
    await db.insert(votesTable).values({
      groupId: group.id,
      participantId: participant.id,
      storyId: activeStory?.id ?? null,
      round: group.round,
      value: parsed.data.value,
    });
  }

  res.json(CastVoteResponse.parse(await serializeGroup(group)));
});

router.patch("/participants/:id", async (req, res): Promise<void> => {
  const params = UpdateParticipantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  if (parsed.data.teamId != null) {
    const [team] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, parsed.data.teamId));
    if (!team || team.roomId !== existing.roomId) {
      res.status(400).json({ error: "Team does not belong to this room" });
      return;
    }
  }

  const updates: Partial<typeof participantsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.isSpectator !== undefined)
    updates.isSpectator = parsed.data.isSpectator;
  if (parsed.data.groupId !== undefined) updates.groupId = parsed.data.groupId;
  if (parsed.data.teamId !== undefined) updates.teamId = parsed.data.teamId;

  const [participant] = await db
    .update(participantsTable)
    .set(updates)
    .where(eq(participantsTable.id, params.data.id))
    .returning();

  res.json(UpdateParticipantResponse.parse(participant));
});

router.delete("/participants/:id", async (req, res): Promise<void> => {
  const params = LeaveRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [participant] = await db
    .delete(participantsTable)
    .where(eq(participantsTable.id, params.data.id))
    .returning();

  if (!participant) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/rooms/:key/teams", async (req, res): Promise<void> => {
  const params = CreateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.key, params.data.key));

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const existingTeams = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.roomId, room.id));

  const [team] = await db
    .insert(teamsTable)
    .values({
      roomId: room.id,
      name: parsed.data.name,
      color: parsed.data.color ?? TEAM_COLORS[existingTeams.length % TEAM_COLORS.length],
      order: existingTeams.length,
    })
    .returning();

  res.status(201).json(CreateTeamResponse.parse(team));
});

router.patch("/teams/:id", async (req, res): Promise<void> => {
  const params = UpdateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const updates: Partial<typeof teamsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;

  const [team] = await db
    .update(teamsTable)
    .set(updates)
    .where(eq(teamsTable.id, params.data.id))
    .returning();

  res.json(UpdateTeamResponse.parse(team));
});

router.delete("/teams/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db
    .delete(teamsTable)
    .where(eq(teamsTable.id, params.data.id))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/groups/:id/stories", async (req, res): Promise<void> => {
  const params = ImportStoriesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ImportStoriesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const existingStories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.groupId, group.id));

  let nextOrder = existingStories.length;

  const titles = parsed.data.titles
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (titles.length > 0) {
    await db.insert(storiesTable).values(
      titles.map((title) => ({
        groupId: group.id,
        title,
        order: nextOrder++,
      })),
    );
  }

  res
    .status(201)
    .json(ImportStoriesResponse.parse(await serializeGroup(group)));
});

router.post("/stories/:storyId/start", async (req, res): Promise<void> => {
  const params = StartStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId));

  if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, story.groupId));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const [previousActive] = await db
    .select()
    .from(storiesTable)
    .where(
      and(
        eq(storiesTable.groupId, group.id),
        eq(storiesTable.status, "active"),
      ),
    );

  if (previousActive) {
    await db
      .update(storiesTable)
      .set({
        status: "done",
        finalEstimate: group.revealed
          ? ((await serializeGroup(group)).average?.toString() ?? null)
          : null,
      })
      .where(eq(storiesTable.id, previousActive.id));
  }

  await db
    .update(storiesTable)
    .set({ status: "active" })
    .where(eq(storiesTable.id, story.id));

  const [updatedGroup] = await db
    .update(groupsTable)
    .set({
      currentStoryTitle: story.title,
      revealed: false,
      round: group.round + 1,
    })
    .where(eq(groupsTable.id, group.id))
    .returning();

  res.json(StartStoryResponse.parse(await serializeGroup(updatedGroup)));
});

router.get("/stories/:storyId/votes", async (req, res): Promise<void> => {
  const params = GetStoryVotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId));

  if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }

  const storyVotes = await db
    .select()
    .from(votesTable)
    .where(eq(votesTable.storyId, story.id));

  // A story can span multiple rounds (re-votes); keep each participant's
  // latest-round vote.
  const latestByParticipant = new Map<string, (typeof storyVotes)[number]>();
  for (const v of storyVotes) {
    const prev = latestByParticipant.get(v.participantId);
    if (!prev || v.round > prev.round) latestByParticipant.set(v.participantId, v);
  }

  const participants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.groupId, story.groupId));
  const participantById = new Map(participants.map((p) => [p.id, p]));

  const votes = [...latestByParticipant.values()]
    .map((v) => {
      const participant = participantById.get(v.participantId);
      if (!participant) return null;
      return {
        participantId: v.participantId,
        name: participant.name,
        teamId: participant.teamId,
        value: v.value,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const stats = computeStats(votes.map((v) => v.value));

  res.json(
    GetStoryVotesResponse.parse({
      storyId: story.id,
      title: story.title,
      finalEstimate: story.finalEstimate,
      average: stats.average,
      allSame: stats.allSame,
      votes,
    }),
  );
});

router.delete("/stories/:storyId", async (req, res): Promise<void> => {
  const params = DeleteStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [story] = await db
    .delete(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId))
    .returning();

  if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
