import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetRoomState, 
  getGetRoomStateQueryKey,
  useUpdateGroup, 
  useRevealGroupVotes, 
  useResetGroupVotes,
  useCastVote,
  useJoinRoom,
  useImportStories,
  useStartStory,
  useGetStoryVotes,
  getGetStoryVotesQueryKey,
  useDeleteStory,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useUpdateParticipant
} from "@workspace/api-client-react";
import { getStoredParticipant, setStoredParticipant } from "@/lib/storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Plus, Users, RotateCcw, Eye, Play, Upload, Trash2, ListChecks, UserPlus, Search, Clock, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function parseCsvTitles(text: string): string[] {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells.map((c) => c.trim());
  };

  const rows = lines.map(parseLine);
  const header = rows[0].map((h) => h.toLowerCase());
  const titleColumnIndex = header.findIndex((h) =>
    ["summary", "title", "story", "issue summary", "name"].includes(h),
  );

  if (titleColumnIndex >= 0) {
    return rows
      .slice(1)
      .map((r) => r[titleColumnIndex] ?? "")
      .filter((t) => t.length > 0);
  }

  return rows.map((r) => r[0]).filter((t) => t.length > 0);
}

const CARD_SCALES: Record<string, string[]> = {
  fibonacci: ["1", "2", "3", "5", "8", "☕"],
  tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?"],
};

const AVATAR_COLORS = [
  "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
  "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30",
];

function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const TEAM_COLOR_CLASSES: Record<string, string> = {
  sky: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
  rose: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  amber: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  emerald: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  violet: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  pink: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
  teal: "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30",
};

function teamColorClass(color: string): string {
  return TEAM_COLOR_CLASSES[color] ?? TEAM_COLOR_CLASSES.sky;
}

function TeamTag({ name, color }: { name: string; color: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${teamColorClass(color)}`}>
      {name}
    </span>
  );
}

function Avatar({ name, size = "sm" }: { name: string, size?: "sm" | "lg" }) {
  const dims = size === "lg" ? "h-full w-full text-base" : "h-6 w-6 text-xs shrink-0";
  return (
    <div className={`rounded-full border flex items-center justify-center font-semibold uppercase ${dims} ${avatarColorFor(name)}`}>
      {name.charAt(0)}
    </div>
  );
}

function ParticipantSlot({ p, revealed }: { p: { id: string; name: string; hasVoted: boolean; voteValue?: string | null }, revealed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 relative">
        <div className={`absolute inset-0 poker-card ${revealed ? 'revealed' : ''}`}>
          <div className={`poker-card-front absolute inset-0 rounded-full border-2 flex items-center justify-center bg-card
            ${p.hasVoted ? 'border-primary shadow-[0_0_10px_hsl(200_90%_68%/0.3)]' : 'border-border opacity-60 border-dashed'}
          `}>
            <Avatar name={p.name} size="lg" />
          </div>
          <div className="poker-card-back absolute inset-0 rounded-xl border-2 border-secondary bg-secondary/10 flex items-center justify-center font-mono font-bold text-lg text-foreground">
            {p.voteValue || '-'}
          </div>
        </div>
      </div>
      <span className="text-xs font-medium max-w-[5rem] truncate" title={p.name}>{p.name}</span>
      {!revealed && (
        <span className={`text-[10px] uppercase tracking-wider ${p.hasVoted ? 'text-primary' : 'text-muted-foreground/70'}`}>
          {p.hasVoted ? 'Voted' : 'Voting...'}
        </span>
      )}
    </div>
  );
}

function PokerCard({ value, selected, onSelect, disabled }: { value: string, selected: boolean, onSelect: () => void, disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200
        flex items-center justify-center font-mono text-xl font-bold h-14 w-full
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-x-1 hover:shadow-lg cursor-pointer'}
        ${selected 
          ? 'bg-primary border-primary text-primary-foreground scale-105 shadow-[0_0_15px_hsl(200_90%_68%/0.5)]' 
          : 'bg-card border-border text-foreground'}
      `}
      data-testid={`card-select-${value}`}
    >
      {value}
    </button>
  );
}

export default function RoomPage() {
  const { key } = useParams<{ key: string }>();
  const [, setLocation] = useLocation();
  const [joinName, setJoinName] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [csvGroupTarget, setCsvGroupTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newStoryTitles, setNewStoryTitles] = useState<Record<string, string>>({});
  const [showAddInput, setShowAddInput] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [showGroupsDialog, setShowGroupsDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [historyStoryId, setHistoryStoryId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: roomState, isLoading, error } = useGetRoomState(key, { query: { queryKey: getGetRoomStateQueryKey(key), refetchInterval: 2000 } });
  
  const joinRoom = useJoinRoom();
  const updateGroup = useUpdateGroup();
  const revealVotes = useRevealGroupVotes();
  const resetVotes = useResetGroupVotes();
  const castVote = useCastVote();
  const importStories = useImportStories();
  const startStory = useStartStory();
  const deleteStory = useDeleteStory();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const updateParticipant = useUpdateParticipant();
  const { data: storyHistory, isLoading: historyLoading } = useGetStoryVotes(
    historyStoryId ?? "",
    { query: { queryKey: getGetStoryVotesQueryKey(historyStoryId ?? ""), enabled: !!historyStoryId } },
  );

  const invalidateRoom = () =>
    queryClient.invalidateQueries({ queryKey: getGetRoomStateQueryKey(key) });

  const storedParticipant = getStoredParticipant(key);
  const autoRevealedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && roomState && !storedParticipant) {
      setShowJoinDialog(true);
    }
  }, [isLoading, roomState, storedParticipant]);

  // Auto-reveal a group's votes once every participant at the table has voted.
  useEffect(() => {
    if (!roomState) return;
    for (const group of roomState.groups) {
      if (
        !group.revealed &&
        group.currentStoryTitle &&
        group.participants.length > 0 &&
        group.participants.every((p) => p.hasVoted) &&
        !autoRevealedRef.current.has(group.id)
      ) {
        autoRevealedRef.current.add(group.id);
        revealVotes.mutate({ id: group.id });
      }
      if (!group.participants.every((p) => p.hasVoted) || group.revealed) {
        autoRevealedRef.current.delete(group.id);
      }
    }
  }, [roomState, revealVotes]);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Room Not Found</CardTitle>
            <CardDescription>The room you are looking for does not exist or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !roomState) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-muted-foreground font-mono">LOADING_TABLE...</p>
        </div>
      </div>
    );
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;
    await performJoin(joinName.trim());
  };

  const performJoin = async (name: string) => {
    try {
      const participant = await joinRoom.mutateAsync({
        key,
        data: { name }
      });
      setStoredParticipant(key, { id: participant.id, name: participant.name });
      setShowJoinDialog(false);
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to join room");
    }
  };

  const handleJoinAsGuest = async () => {
    const guestName = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
    await performJoin(guestName);
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to legacy fallback below
      }
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const copyRoomCode = async () => {
    const ok = await copyToClipboard(key);
    if (ok) {
      toast.success("Room code copied to clipboard!");
    } else {
      toast.error(`Couldn't copy automatically. Room code: ${key}`);
    }
  };

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/room/${key}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      toast.success("Invite link copied to clipboard!");
    } else {
      toast.error(`Couldn't copy automatically. Link: ${url}`);
    }
  };

  const handleCastVote = async (groupId: string, value: string) => {
    if (!storedParticipant) return;
    try {
      await castVote.mutateAsync({
        id: groupId,
        data: { participantId: storedParticipant.id, value }
      });
    } catch (err: any) {
      toast.error("Failed to cast vote");
    }
  };

  const handleRenameStory = async (groupId: string) => {
    const title = prompt("New Story Title:");
    if (title !== null) {
      await updateGroup.mutateAsync({
        id: groupId,
        data: { currentStoryTitle: title }
      });
    }
  };

  const handleImportClick = (groupId: string) => {
    setCsvGroupTarget(groupId);
    fileInputRef.current?.click();
  };

  const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const groupId = csvGroupTarget;
    e.target.value = "";
    if (!file || !groupId) return;

    try {
      const text = await file.text();
      const titles = parseCsvTitles(text);
      if (titles.length === 0) {
        toast.error("No story titles found in that file");
        return;
      }
      await importStories.mutateAsync({ id: groupId, data: { titles } });
      toast.success(`Imported ${titles.length} ${titles.length === 1 ? "story" : "stories"}`);
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to import CSV");
    } finally {
      setCsvGroupTarget(null);
    }
  };

  const handleAddStory = async (groupId: string) => {
    const title = (newStoryTitles[groupId] || "").trim();
    if (!title) return;
    try {
      await importStories.mutateAsync({ id: groupId, data: { titles: [title] } });
      setNewStoryTitles((prev) => ({ ...prev, [groupId]: "" }));
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to add story");
    }
  };

  const handleStartStory = async (storyId: string) => {
    try {
      await startStory.mutateAsync({ storyId });
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to start story");
    }
  };

  const handleNextRound = async () => {
    if (!myGroup) return;
    const nextPending = [...myGroup.backlog]
      .filter((s) => s.status === "pending")
      .sort((a, b) => a.order - b.order)[0];
    if (nextPending) {
      try {
        await startStory.mutateAsync({ storyId: nextPending.id });
      } catch (err: any) {
        toast.error(err.error || err.message || "Failed to start next story");
      }
    } else {
      resetVotes.mutate({ id: myGroup.id });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteStory.mutateAsync({ storyId });
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to remove story");
    }
  };

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) return;
    try {
      await createTeam.mutateAsync({ key, data: { name } });
      setNewTeamName("");
      await invalidateRoom();
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to create group");
    }
  };

  const handleRenameTeam = async (teamId: string, currentName: string) => {
    const name = prompt("New group name:", currentName);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateTeam.mutateAsync({ id: teamId, data: { name: trimmed } });
      await invalidateRoom();
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to rename group");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam.mutateAsync({ id: teamId });
      await invalidateRoom();
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to delete group");
    }
  };

  const handleAssignTeam = async (participantId: string, teamId: string | null) => {
    try {
      await updateParticipant.mutateAsync({ id: participantId, data: { teamId } });
      await invalidateRoom();
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to assign group");
    }
  };

  // The room has a single shared voting table.
  const myGroup = roomState.groups[0];
  const myVote = myGroup ? myGroup.participants.find(p => p.id === storedParticipant?.id)?.voteValue : null;
  const deck = CARD_SCALES[roomState.room.votingScale] ?? CARD_SCALES.fibonacci;
  const waiting = myGroup ? myGroup.participants.filter(p => !p.hasVoted) : [];
  const voted = myGroup ? myGroup.participants.filter(p => p.hasVoted) : [];
  const visibleBacklog = myGroup
    ? myGroup.backlog.filter(s => s.title.toLowerCase().includes(ticketSearch.trim().toLowerCase()))
    : [];

  const teams = roomState.teams ?? [];
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const allParticipants = myGroup ? myGroup.participants : [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-28">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-mono font-extrabold text-primary-foreground shrink-0">
              ♠
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-foreground">{roomState.room.name}</h1>
              <button onClick={copyRoomCode} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono">
                {key} <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/40 border border-border rounded-full px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> {roomState.participantCount}/{roomState.maxParticipants}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowGroupsDialog(true)} className="font-medium">
              <Users className="mr-2 h-4 w-4" /> Manage Groups
            </Button>
            <Button size="sm" onClick={copyInviteLink} className="font-medium">
              <UserPlus className="mr-2 h-4 w-4" /> Invite Others
            </Button>
            {storedParticipant && (
              <div className="hidden sm:block text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {storedParticipant.name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-6 items-start">

        {/* Left: Waiting / Voted participant status */}
        <aside className="w-full space-y-4 order-2 lg:order-1">
          <div className="rounded-xl border border-border bg-card/60">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Waiting
              <span className="ml-auto bg-muted text-foreground px-2 py-0.5 rounded-full text-[11px]">{waiting.length}</span>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2 text-center">No one waiting</div>
              ) : (
                <ul className="space-y-1">
                  {waiting.map(p => {
                    const team = p.teamId ? teamById.get(p.teamId) : undefined;
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-sm font-medium py-1">
                        <Avatar name={p.name} />
                        <span className="truncate flex-1">{p.name}</span>
                        {team && <TeamTag name={team.name} color={team.color} />}
                        {p.id === storedParticipant?.id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/30 uppercase shrink-0">You</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" /> Voted
              <span className="ml-auto bg-muted text-foreground px-2 py-0.5 rounded-full text-[11px]">{voted.length}</span>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {voted.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2 text-center">No votes yet</div>
              ) : (
                <ul className="space-y-1">
                  {voted.map(p => {
                    const team = p.teamId ? teamById.get(p.teamId) : undefined;
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-sm font-medium py-1">
                        <Avatar name={p.name} />
                        <span className="truncate flex-1">{p.name}</span>
                        {team && <TeamTag name={team.name} color={team.color} />}
                        {p.id === storedParticipant?.id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/30 uppercase shrink-0">You</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* Center: Shared voting table */}
        <div className="w-full order-1 lg:order-2">
          {!myGroup ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-muted-foreground font-mono text-sm">Setting up the room...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
              {/* Ticket / story bar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
                <span className="font-semibold text-foreground truncate flex-1">
                  {myGroup.currentStoryTitle || "No active story"}
                </span>
                <button onClick={() => handleRenameStory(myGroup.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 underline decoration-dotted underline-offset-2">
                  {myGroup.currentStoryTitle ? "Edit" : "Set story"}
                </button>
              </div>

              {/* Participants arranged around the reveal panel */}
              <div className="px-5 py-10 min-h-[20rem] flex flex-col items-center justify-center gap-4">
                {myGroup.participants.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">No one has joined yet</div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-center gap-6 max-w-2xl">
                      {myGroup.participants.filter((_, i) => i % 2 === 0).map(p => (
                        <ParticipantSlot key={p.id} p={p} revealed={myGroup.revealed} />
                      ))}
                    </div>

                    <div className="w-full max-w-xs">
                      {!myGroup.revealed ? (
                        <button
                          onClick={() => revealVotes.mutate({ id: myGroup.id })}
                          disabled={!myGroup.participants.some(p => p.hasVoted)}
                          className="w-full py-6 rounded-xl border-2 border-dashed border-primary/40 text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          Reveal votes
                        </button>
                      ) : (
                        <button
                          onClick={handleNextRound}
                          className="w-full py-6 rounded-xl border-2 border-primary/40 bg-primary/5 text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {[...myGroup.backlog].some((s) => s.status === "pending") ? "Next Story" : "Next Round"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 max-w-2xl">
                      {myGroup.participants.filter((_, i) => i % 2 === 1).map(p => (
                        <ParticipantSlot key={p.id} p={p} revealed={myGroup.revealed} />
                      ))}
                    </div>

                    {myGroup.revealed && teams.length > 0 && (
                      <div className="w-full max-w-2xl mt-4 space-y-3 animate-in fade-in duration-300">
                        <div className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground">Votes by group</div>
                        {[
                          ...teams.map((t) => ({
                            id: t.id,
                            name: t.name,
                            color: t.color,
                            members: myGroup.participants.filter((p) => p.teamId === t.id),
                          })),
                          {
                            id: "__ungrouped__",
                            name: "Ungrouped",
                            color: "sky",
                            members: myGroup.participants.filter((p) => !p.teamId),
                          },
                        ]
                          .filter((g) => g.members.length > 0)
                          .map((g) => (
                            <div key={g.id} className="rounded-xl border border-border bg-muted/20 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {g.id === "__ungrouped__" ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider text-muted-foreground border-border">
                                    Ungrouped
                                  </span>
                                ) : (
                                  <TeamTag name={g.name} color={g.color} />
                                )}
                                <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                                  {g.members.length} {g.members.length === 1 ? "person" : "people"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {g.members.map((p) => (
                                  <div key={p.id} className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2 py-1">
                                    <Avatar name={p.name} />
                                    <span className="text-sm font-medium max-w-[7rem] truncate" title={p.name}>{p.name}</span>
                                    <span className="font-mono font-bold text-secondary text-sm ml-1">{p.voteValue ?? "-"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-3">
                  <span>Round {myGroup.round}</span>
                  {myGroup.currentStoryTitle && (
                    <span className="flex items-center gap-1 text-muted-foreground/80">
                      <Users className="h-3 w-3" />
                      {myGroup.participants.filter(p => p.hasVoted).length}/{myGroup.participants.length} voted
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Backlog / tickets */}
        <aside className="w-full order-3 space-y-3">
          <div className="rounded-xl border border-border bg-card/60">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search and filter tickets..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="bg-background h-8 text-sm pl-8"
                />
              </div>
              {myGroup && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 shrink-0"
                  onClick={() => handleImportClick(myGroup.id)}
                  disabled={importStories.isPending}
                  title="Import CSV"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {!myGroup ? (
              <div className="p-4 text-xs text-muted-foreground italic text-center">Loading backlog...</div>
            ) : (
              <div className="p-3 space-y-2">
                {visibleBacklog.length > 0 && (
                  <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                    {visibleBacklog.map((story, i) => (
                      <li
                        key={story.id}
                        onClick={story.status === 'done' ? () => setHistoryStoryId(story.id) : undefined}
                        title={story.status === 'done' ? 'View recorded votes' : undefined}
                        className={`rounded-lg border px-3 py-2.5 text-sm
                          ${story.status === 'active' ? 'border-primary/40 bg-primary/5' : story.status === 'done' ? 'border-border opacity-60 hover:opacity-100 cursor-pointer transition-opacity' : 'border-border bg-muted/20'}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded shrink-0
                            ${story.status === 'active' ? 'bg-primary/20 text-primary' : story.status === 'done' ? 'bg-muted text-muted-foreground' : 'bg-secondary/20 text-secondary'}
                          `}>
                            {story.status === 'active' ? 'Active' : story.status === 'done' ? 'Done' : 'Pending'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">T-{i + 1}</span>
                          {story.status !== 'done' && (
                            <span className="text-[10px] font-mono text-muted-foreground/80 ml-auto shrink-0">
                              {story.status === 'active' ? `${myGroup.participants.filter(p => p.hasVoted).length}/${myGroup.participants.length}` : `0/${myGroup.participants.length}`}
                            </span>
                          )}
                          {story.status === 'done' && story.finalEstimate && (
                            <span className="text-xs font-mono text-secondary ml-auto shrink-0">{story.finalEstimate}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate flex-1" title={story.title}>{story.title}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {story.status === 'pending' && (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleStartStory(story.id)}>
                                <Play className="h-3 w-3 mr-1" /> Start voting
                              </Button>
                            )}
                            {story.status === 'active' && (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => resetVotes.mutate({ id: myGroup.id })}>
                                <RotateCcw className="h-3 w-3 mr-1" /> Reset
                              </Button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteStory(story.id); }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove ticket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {visibleBacklog.length === 0 && (
                  <div className="text-xs text-muted-foreground italic py-2 text-center">
                    {ticketSearch ? "No tickets match your search" : "No tickets yet"}
                  </div>
                )}

                {showAddInput ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      autoFocus
                      placeholder="Ticket title..."
                      value={newStoryTitles[myGroup.id] || ""}
                      onChange={(e) => setNewStoryTitles((prev) => ({ ...prev, [myGroup.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStory(myGroup.id); setShowAddInput(false); } }}
                      onBlur={() => { if (!(newStoryTitles[myGroup.id] || "").trim()) setShowAddInput(false); }}
                      className="bg-background h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0"
                      onClick={() => { handleAddStory(myGroup.id); setShowAddInput(false); }}
                      disabled={importStories.isPending || !(newStoryTitles[myGroup.id] || "").trim()}
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground pt-1"
                    onClick={() => setShowAddInput(true)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add another
                  </Button>
                )}

                <p className="text-[11px] text-muted-foreground pt-1">
                  Import a Jira CSV export using the upload icon above (uses the "Summary" column, or the first column).
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Fixed bottom card dock */}
      {myGroup && myGroup.currentStoryTitle && !myGroup.revealed && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-4 py-4">
            <div className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2.5">Choose your card</div>
            <div className="flex justify-center gap-2 overflow-x-auto pb-1">
              {deck.map(val => (
                <div key={val} className="w-14 shrink-0">
                  <PokerCard
                    value={val}
                    selected={myVote === val}
                    onSelect={() => handleCastVote(myGroup.id, val)}
                    disabled={myGroup.revealed}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manage Groups Dialog */}
      <Dialog open={showGroupsDialog} onOpenChange={setShowGroupsDialog}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl">Manage Groups</DialogTitle>
            <DialogDescription>
              Create groups (e.g. Frontend, Backend) and assign participants. Everyone still votes on the same story — groups just organize how votes are displayed on reveal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New group name (e.g. Frontend)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTeam(); } }}
                className="bg-background h-9"
              />
              <Button
                type="button"
                className="h-9 shrink-0"
                onClick={handleCreateTeam}
                disabled={createTeam.isPending || !newTeamName.trim()}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add
              </Button>
            </div>

            {teams.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {teams.map((t) => (
                  <div key={t.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 pl-2 pr-1 py-1">
                    <TeamTag name={t.name} color={t.color} />
                    <button
                      onClick={() => handleRenameTeam(t.id, t.name)}
                      className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-wider"
                      title="Rename group"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(t.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assign participants</Label>
              {allParticipants.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">No participants yet.</div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {allParticipants.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <Avatar name={p.name} />
                      <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                      <select
                        value={p.teamId ?? ""}
                        onChange={(e) => handleAssignTeam(p.id, e.target.value || null)}
                        className="h-8 rounded-md border border-border bg-background text-sm px-2 text-foreground shrink-0"
                      >
                        <option value="">No group</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowGroupsDialog(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Story vote history */}
      <Dialog open={!!historyStoryId} onOpenChange={(o) => { if (!o) setHistoryStoryId(null); }}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl truncate" title={storyHistory?.title}>
              {storyHistory?.title ?? "Vote history"}
            </DialogTitle>
            <DialogDescription>
              {storyHistory && (storyHistory.finalEstimate != null || storyHistory.average != null)
                ? `Final estimate: ${storyHistory.finalEstimate ?? storyHistory.average}${storyHistory.allSame ? " · consensus reached" : ""}`
                : "Recorded votes for this story."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {historyLoading ? (
              <div className="text-sm text-muted-foreground italic text-center py-6">Loading votes...</div>
            ) : !storyHistory || storyHistory.votes.length === 0 ? (
              <div className="text-sm text-muted-foreground italic text-center py-6">No votes were recorded for this story.</div>
            ) : (
              [
                ...teams.map((t) => ({
                  id: t.id,
                  name: t.name,
                  color: t.color,
                  members: storyHistory.votes.filter((v) => v.teamId === t.id),
                })),
                {
                  id: "__ungrouped__",
                  name: "Ungrouped",
                  color: "sky",
                  members: storyHistory.votes.filter((v) => !v.teamId),
                },
              ]
                .filter((g) => g.members.length > 0)
                .map((g) => (
                  <div key={g.id} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {g.id === "__ungrouped__" ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider text-muted-foreground border-border">
                          Ungrouped
                        </span>
                      ) : (
                        <TeamTag name={g.name} color={g.color} />
                      )}
                      <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                        {g.members.length} {g.members.length === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.members.map((v) => (
                        <div key={v.participantId} className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2 py-1">
                          <Avatar name={v.name} />
                          <span className="text-sm font-medium max-w-[7rem] truncate" title={v.name}>{v.name}</span>
                          <span className="font-mono font-bold text-secondary text-sm ml-1">{v.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setHistoryStoryId(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Dialog for Newcomers to Link */}
      <Dialog open={showJoinDialog} onOpenChange={(o) => { if (!o && storedParticipant) setShowJoinDialog(false); }}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <form onSubmit={handleJoin}>
            <DialogHeader>
              <DialogTitle className="font-mono text-xl">Join Room</DialogTitle>
              <DialogDescription>
                You've been invited to estimate! Enter your name to join.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button type="submit" disabled={joinRoom.isPending || !joinName.trim()} className="w-full font-mono font-bold">
                {joinRoom.isPending ? "Joining..." : "Enter Room"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full font-mono text-muted-foreground"
                disabled={joinRoom.isPending}
                onClick={handleJoinAsGuest}
              >
                Continue as Guest
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvFileSelected}
      />
    </div>
  );
}
