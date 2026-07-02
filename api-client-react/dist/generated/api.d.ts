import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ErrorResponse, Group, GroupInput, GroupUpdate, HealthStatus, ImportStoriesInput, JoinRoomInput, Participant, ParticipantUpdate, Room, RoomInput, RoomState, StoryVotes, Team, TeamInput, TeamUpdate, VoteInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateRoomUrl: () => string;
/**
 * @summary Create a new planning poker room
 */
export declare const createRoom: (roomInput: RoomInput, options?: RequestInit) => Promise<Room>;
export declare const getCreateRoomMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRoom>>, TError, {
        data: BodyType<RoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRoom>>, TError, {
    data: BodyType<RoomInput>;
}, TContext>;
export type CreateRoomMutationResult = NonNullable<Awaited<ReturnType<typeof createRoom>>>;
export type CreateRoomMutationBody = BodyType<RoomInput>;
export type CreateRoomMutationError = ErrorType<unknown>;
/**
* @summary Create a new planning poker room
*/
export declare const useCreateRoom: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRoom>>, TError, {
        data: BodyType<RoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRoom>>, TError, {
    data: BodyType<RoomInput>;
}, TContext>;
export declare const getGetRoomStateUrl: (key: string) => string;
/**
 * @summary Get full room state (room, groups, participants) for polling
 */
export declare const getRoomState: (key: string, options?: RequestInit) => Promise<RoomState>;
export declare const getGetRoomStateQueryKey: (key: string) => readonly [`/api/rooms/${string}`];
export declare const getGetRoomStateQueryOptions: <TData = Awaited<ReturnType<typeof getRoomState>>, TError = ErrorType<ErrorResponse>>(key: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRoomStateQueryResult = NonNullable<Awaited<ReturnType<typeof getRoomState>>>;
export type GetRoomStateQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get full room state (room, groups, participants) for polling
 */
export declare function useGetRoomState<TData = Awaited<ReturnType<typeof getRoomState>>, TError = ErrorType<ErrorResponse>>(key: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getJoinRoomUrl: (key: string) => string;
/**
 * @summary Join a room as a participant
 */
export declare const joinRoom: (key: string, joinRoomInput: JoinRoomInput, options?: RequestInit) => Promise<Participant>;
export declare const getJoinRoomMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
        key: string;
        data: BodyType<JoinRoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
    key: string;
    data: BodyType<JoinRoomInput>;
}, TContext>;
export type JoinRoomMutationResult = NonNullable<Awaited<ReturnType<typeof joinRoom>>>;
export type JoinRoomMutationBody = BodyType<JoinRoomInput>;
export type JoinRoomMutationError = ErrorType<ErrorResponse>;
/**
* @summary Join a room as a participant
*/
export declare const useJoinRoom: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
        key: string;
        data: BodyType<JoinRoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof joinRoom>>, TError, {
    key: string;
    data: BodyType<JoinRoomInput>;
}, TContext>;
export declare const getCreateGroupUrl: (key: string) => string;
/**
 * @summary Create a new group (breakout table) in a room
 */
export declare const createGroup: (key: string, groupInput: GroupInput, options?: RequestInit) => Promise<Group>;
export declare const getCreateGroupMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGroup>>, TError, {
        key: string;
        data: BodyType<GroupInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGroup>>, TError, {
    key: string;
    data: BodyType<GroupInput>;
}, TContext>;
export type CreateGroupMutationResult = NonNullable<Awaited<ReturnType<typeof createGroup>>>;
export type CreateGroupMutationBody = BodyType<GroupInput>;
export type CreateGroupMutationError = ErrorType<ErrorResponse>;
/**
* @summary Create a new group (breakout table) in a room
*/
export declare const useCreateGroup: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGroup>>, TError, {
        key: string;
        data: BodyType<GroupInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGroup>>, TError, {
    key: string;
    data: BodyType<GroupInput>;
}, TContext>;
export declare const getUpdateGroupUrl: (id: string) => string;
/**
 * @summary Rename a group or set its current story (resets votes and reveal state)
 */
export declare const updateGroup: (id: string, groupUpdate: GroupUpdate, options?: RequestInit) => Promise<Group>;
export declare const getUpdateGroupMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateGroup>>, TError, {
        id: string;
        data: BodyType<GroupUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateGroup>>, TError, {
    id: string;
    data: BodyType<GroupUpdate>;
}, TContext>;
export type UpdateGroupMutationResult = NonNullable<Awaited<ReturnType<typeof updateGroup>>>;
export type UpdateGroupMutationBody = BodyType<GroupUpdate>;
export type UpdateGroupMutationError = ErrorType<ErrorResponse>;
/**
* @summary Rename a group or set its current story (resets votes and reveal state)
*/
export declare const useUpdateGroup: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateGroup>>, TError, {
        id: string;
        data: BodyType<GroupUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateGroup>>, TError, {
    id: string;
    data: BodyType<GroupUpdate>;
}, TContext>;
export declare const getDeleteGroupUrl: (id: string) => string;
/**
 * @summary Delete a group; its participants become unassigned
 */
export declare const deleteGroup: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteGroupMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGroup>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteGroup>>, TError, {
    id: string;
}, TContext>;
export type DeleteGroupMutationResult = NonNullable<Awaited<ReturnType<typeof deleteGroup>>>;
export type DeleteGroupMutationError = ErrorType<ErrorResponse>;
/**
* @summary Delete a group; its participants become unassigned
*/
export declare const useDeleteGroup: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGroup>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteGroup>>, TError, {
    id: string;
}, TContext>;
export declare const getRevealGroupVotesUrl: (id: string) => string;
/**
 * @summary Reveal votes for a group's current round
 */
export declare const revealGroupVotes: (id: string, options?: RequestInit) => Promise<Group>;
export declare const getRevealGroupVotesMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revealGroupVotes>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof revealGroupVotes>>, TError, {
    id: string;
}, TContext>;
export type RevealGroupVotesMutationResult = NonNullable<Awaited<ReturnType<typeof revealGroupVotes>>>;
export type RevealGroupVotesMutationError = ErrorType<ErrorResponse>;
/**
* @summary Reveal votes for a group's current round
*/
export declare const useRevealGroupVotes: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revealGroupVotes>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof revealGroupVotes>>, TError, {
    id: string;
}, TContext>;
export declare const getResetGroupVotesUrl: (id: string) => string;
/**
 * @summary Start a new voting round for a group (clears votes, hides reveal)
 */
export declare const resetGroupVotes: (id: string, options?: RequestInit) => Promise<Group>;
export declare const getResetGroupVotesMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetGroupVotes>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetGroupVotes>>, TError, {
    id: string;
}, TContext>;
export type ResetGroupVotesMutationResult = NonNullable<Awaited<ReturnType<typeof resetGroupVotes>>>;
export type ResetGroupVotesMutationError = ErrorType<ErrorResponse>;
/**
* @summary Start a new voting round for a group (clears votes, hides reveal)
*/
export declare const useResetGroupVotes: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetGroupVotes>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetGroupVotes>>, TError, {
    id: string;
}, TContext>;
export declare const getImportStoriesUrl: (id: string) => string;
/**
 * @summary Bulk import stories into a group's backlog (e.g. from a CSV file)
 */
export declare const importStories: (id: string, importStoriesInput: ImportStoriesInput, options?: RequestInit) => Promise<Group>;
export declare const getImportStoriesMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importStories>>, TError, {
        id: string;
        data: BodyType<ImportStoriesInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof importStories>>, TError, {
    id: string;
    data: BodyType<ImportStoriesInput>;
}, TContext>;
export type ImportStoriesMutationResult = NonNullable<Awaited<ReturnType<typeof importStories>>>;
export type ImportStoriesMutationBody = BodyType<ImportStoriesInput>;
export type ImportStoriesMutationError = ErrorType<ErrorResponse>;
/**
* @summary Bulk import stories into a group's backlog (e.g. from a CSV file)
*/
export declare const useImportStories: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importStories>>, TError, {
        id: string;
        data: BodyType<ImportStoriesInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof importStories>>, TError, {
    id: string;
    data: BodyType<ImportStoriesInput>;
}, TContext>;
export declare const getStartStoryUrl: (storyId: string) => string;
/**
 * @summary Set a backlog story as the group's active story and start a fresh voting round
 */
export declare const startStory: (storyId: string, options?: RequestInit) => Promise<Group>;
export declare const getStartStoryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startStory>>, TError, {
        storyId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startStory>>, TError, {
    storyId: string;
}, TContext>;
export type StartStoryMutationResult = NonNullable<Awaited<ReturnType<typeof startStory>>>;
export type StartStoryMutationError = ErrorType<ErrorResponse>;
/**
* @summary Set a backlog story as the group's active story and start a fresh voting round
*/
export declare const useStartStory: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startStory>>, TError, {
        storyId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startStory>>, TError, {
    storyId: string;
}, TContext>;
export declare const getGetStoryVotesUrl: (storyId: string) => string;
/**
 * @summary Get the recorded vote history for a story (e.g. a completed backlog item)
 */
export declare const getStoryVotes: (storyId: string, options?: RequestInit) => Promise<StoryVotes>;
export declare const getGetStoryVotesQueryKey: (storyId: string) => readonly [`/api/stories/${string}/votes`];
export declare const getGetStoryVotesQueryOptions: <TData = Awaited<ReturnType<typeof getStoryVotes>>, TError = ErrorType<ErrorResponse>>(storyId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStoryVotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStoryVotes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStoryVotesQueryResult = NonNullable<Awaited<ReturnType<typeof getStoryVotes>>>;
export type GetStoryVotesQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get the recorded vote history for a story (e.g. a completed backlog item)
 */
export declare function useGetStoryVotes<TData = Awaited<ReturnType<typeof getStoryVotes>>, TError = ErrorType<ErrorResponse>>(storyId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStoryVotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteStoryUrl: (storyId: string) => string;
/**
 * @summary Remove a story from the backlog
 */
export declare const deleteStory: (storyId: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteStoryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStory>>, TError, {
        storyId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteStory>>, TError, {
    storyId: string;
}, TContext>;
export type DeleteStoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteStory>>>;
export type DeleteStoryMutationError = ErrorType<ErrorResponse>;
/**
* @summary Remove a story from the backlog
*/
export declare const useDeleteStory: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStory>>, TError, {
        storyId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteStory>>, TError, {
    storyId: string;
}, TContext>;
export declare const getCastVoteUrl: (id: string) => string;
/**
 * @summary Cast or update a vote for the current round
 */
export declare const castVote: (id: string, voteInput: VoteInput, options?: RequestInit) => Promise<Group>;
export declare const getCastVoteMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof castVote>>, TError, {
        id: string;
        data: BodyType<VoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof castVote>>, TError, {
    id: string;
    data: BodyType<VoteInput>;
}, TContext>;
export type CastVoteMutationResult = NonNullable<Awaited<ReturnType<typeof castVote>>>;
export type CastVoteMutationBody = BodyType<VoteInput>;
export type CastVoteMutationError = ErrorType<ErrorResponse>;
/**
* @summary Cast or update a vote for the current round
*/
export declare const useCastVote: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof castVote>>, TError, {
        id: string;
        data: BodyType<VoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof castVote>>, TError, {
    id: string;
    data: BodyType<VoteInput>;
}, TContext>;
export declare const getUpdateParticipantUrl: (id: string) => string;
/**
 * @summary Move a participant to a different group, toggle spectator, or rename
 */
export declare const updateParticipant: (id: string, participantUpdate: ParticipantUpdate, options?: RequestInit) => Promise<Participant>;
export declare const getUpdateParticipantMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateParticipant>>, TError, {
        id: string;
        data: BodyType<ParticipantUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateParticipant>>, TError, {
    id: string;
    data: BodyType<ParticipantUpdate>;
}, TContext>;
export type UpdateParticipantMutationResult = NonNullable<Awaited<ReturnType<typeof updateParticipant>>>;
export type UpdateParticipantMutationBody = BodyType<ParticipantUpdate>;
export type UpdateParticipantMutationError = ErrorType<ErrorResponse>;
/**
* @summary Move a participant to a different group, toggle spectator, or rename
*/
export declare const useUpdateParticipant: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateParticipant>>, TError, {
        id: string;
        data: BodyType<ParticipantUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateParticipant>>, TError, {
    id: string;
    data: BodyType<ParticipantUpdate>;
}, TContext>;
export declare const getLeaveRoomUrl: (id: string) => string;
/**
 * @summary Remove a participant from the room
 */
export declare const leaveRoom: (id: string, options?: RequestInit) => Promise<void>;
export declare const getLeaveRoomMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof leaveRoom>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof leaveRoom>>, TError, {
    id: string;
}, TContext>;
export type LeaveRoomMutationResult = NonNullable<Awaited<ReturnType<typeof leaveRoom>>>;
export type LeaveRoomMutationError = ErrorType<ErrorResponse>;
/**
* @summary Remove a participant from the room
*/
export declare const useLeaveRoom: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof leaveRoom>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof leaveRoom>>, TError, {
    id: string;
}, TContext>;
export declare const getCreateTeamUrl: (key: string) => string;
/**
 * @summary Create a participant group (team) in a room
 */
export declare const createTeam: (key: string, teamInput: TeamInput, options?: RequestInit) => Promise<Team>;
export declare const getCreateTeamMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeam>>, TError, {
        key: string;
        data: BodyType<TeamInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTeam>>, TError, {
    key: string;
    data: BodyType<TeamInput>;
}, TContext>;
export type CreateTeamMutationResult = NonNullable<Awaited<ReturnType<typeof createTeam>>>;
export type CreateTeamMutationBody = BodyType<TeamInput>;
export type CreateTeamMutationError = ErrorType<ErrorResponse>;
/**
* @summary Create a participant group (team) in a room
*/
export declare const useCreateTeam: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeam>>, TError, {
        key: string;
        data: BodyType<TeamInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTeam>>, TError, {
    key: string;
    data: BodyType<TeamInput>;
}, TContext>;
export declare const getUpdateTeamUrl: (id: string) => string;
/**
 * @summary Rename a participant group or change its color
 */
export declare const updateTeam: (id: string, teamUpdate: TeamUpdate, options?: RequestInit) => Promise<Team>;
export declare const getUpdateTeamMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeam>>, TError, {
        id: string;
        data: BodyType<TeamUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTeam>>, TError, {
    id: string;
    data: BodyType<TeamUpdate>;
}, TContext>;
export type UpdateTeamMutationResult = NonNullable<Awaited<ReturnType<typeof updateTeam>>>;
export type UpdateTeamMutationBody = BodyType<TeamUpdate>;
export type UpdateTeamMutationError = ErrorType<ErrorResponse>;
/**
* @summary Rename a participant group or change its color
*/
export declare const useUpdateTeam: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeam>>, TError, {
        id: string;
        data: BodyType<TeamUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTeam>>, TError, {
    id: string;
    data: BodyType<TeamUpdate>;
}, TContext>;
export declare const getDeleteTeamUrl: (id: string) => string;
/**
 * @summary Delete a participant group; its members become ungrouped
 */
export declare const deleteTeam: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteTeamMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeam>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteTeam>>, TError, {
    id: string;
}, TContext>;
export type DeleteTeamMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTeam>>>;
export type DeleteTeamMutationError = ErrorType<ErrorResponse>;
/**
* @summary Delete a participant group; its members become ungrouped
*/
export declare const useDeleteTeam: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeam>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteTeam>>, TError, {
    id: string;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map