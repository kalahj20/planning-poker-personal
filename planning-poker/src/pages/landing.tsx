import React, { useState } from "react";
import { useLocation } from "wouter";
import { useCreateRoom, useJoinRoom } from "@workspace/api-client-react";
import type { RoomInputVotingScale } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setStoredParticipant } from "@/lib/storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { Loader2, Play, LogIn } from "lucide-react";

const VOTING_SCALES = [
  { value: "fibonacci", label: "Fibonacci (0, 1, 2, 3, 5, 8...)" },
  { value: "tshirt", label: "T-Shirt Sizes (XS, S, M, L...)" },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("create");

  const [createName, setCreateName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [votingScale, setVotingScale] = useState<RoomInputVotingScale>("fibonacci");

  const [joinName, setJoinName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !roomName.trim()) return;

    try {
      const room = await createRoom.mutateAsync({ data: { name: roomName, votingScale } });
      const participant = await joinRoom.mutateAsync({
        key: room.key,
        data: { name: createName, isSpectator: false }
      });

      setStoredParticipant(room.key, { id: participant.id, name: participant.name });
      setLocation(`/room/${room.key}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create room");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !roomCode.trim()) return;
    await performJoin(joinName.trim());
  };

  const performJoin = async (name: string) => {
    if (!roomCode.trim()) return;
    try {
      const participant = await joinRoom.mutateAsync({
        key: roomCode,
        data: { name, isSpectator: false }
      });

      setStoredParticipant(roomCode, { id: participant.id, name: participant.name });
      setLocation(`/room/${roomCode}`);
    } catch (err: any) {
      toast.error(err.error || err.message || "Failed to join room");
    }
  };

  const handleJoinAsGuest = async () => {
    const guestName = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
    await performJoin(guestName);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 py-12">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Left: Marketing copy */}
        <div className="hidden lg:block">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-4 font-mono leading-tight">
            PLANNING<span className="text-gradient-poker">POKER</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Estimation made easy. Fast, real-time-feeling story pointing for agile teams.
          </p>
        </div>

        {/* Right: Create / Join card */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2 font-mono">
              PLANNING<span className="text-gradient-poker">POKER</span>
            </h1>
            <p className="text-muted-foreground">Fast, real-time estimation for agile teams</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-card/50">
              <TabsTrigger value="create" className="data-[state=active]:bg-card data-[state=active]:text-primary">Create Room</TabsTrigger>
              <TabsTrigger value="join" className="data-[state=active]:bg-card data-[state=active]:text-primary">Join Room</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <Card className="border-border bg-card">
                <form onSubmit={handleCreate}>
                  <CardHeader>
                    <CardTitle>Create a New Session</CardTitle>
                    <CardDescription>No signup needed — you only need a session name and a voting scale.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name">Session Name</Label>
                      <Input
                        id="room-name"
                        placeholder="Sprint 42 Planning"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                        autoFocus
                        className="bg-background"
                        data-testid="input-room-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voting-scale">Voting Scale</Label>
                      <Select value={votingScale} onValueChange={(v) => setVotingScale(v as RoomInputVotingScale)}>
                        <SelectTrigger id="voting-scale" className="bg-background" data-testid="select-voting-scale">
                          <SelectValue placeholder="Choose a voting scale" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOTING_SCALES.map((scale) => (
                            <SelectItem key={scale.value} value={scale.value}>{scale.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-name">Your Name</Label>
                      <Input
                        id="create-name"
                        placeholder="Jane Doe"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        required
                        className="bg-background"
                        data-testid="input-create-name"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full text-primary-foreground font-bold font-mono tracking-wide"
                      disabled={createRoom.isPending || joinRoom.isPending || !createName.trim() || !roomName.trim()}
                      data-testid="button-create-room"
                    >
                      {(createRoom.isPending || joinRoom.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      Start Planning
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="join">
              <Card className="border-border bg-card">
                <form onSubmit={handleJoin}>
                  <CardHeader>
                    <CardTitle>Join a Session</CardTitle>
                    <CardDescription>Enter a room code to jump in</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-name">Your Name</Label>
                      <Input
                        id="join-name"
                        placeholder="Jane Doe"
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        required
                        className="bg-background"
                        data-testid="input-join-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-code">Room Code</Label>
                      <Input
                        id="room-code"
                        placeholder="e.g. abc-123-xyz"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        required
                        className="bg-background font-mono"
                        data-testid="input-room-code"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full font-bold font-mono tracking-wide"
                      disabled={joinRoom.isPending || !joinName.trim() || !roomCode.trim()}
                      data-testid="button-join-room"
                    >
                      {joinRoom.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                      Join Room
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full font-mono text-muted-foreground"
                      disabled={joinRoom.isPending || !roomCode.trim()}
                      onClick={handleJoinAsGuest}
                      data-testid="button-join-as-guest"
                    >
                      Continue as Guest
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
