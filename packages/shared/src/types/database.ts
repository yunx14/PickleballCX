import type {
  SkillLevel,
  ProfileVisibility,
  CourtType,
  SessionType,
  EventVisibility,
  RsvpStatus,
  GroupMemberRole,
  PlayFormat,
  RankedPreference,
  MatchRequestStatus,
  SessionInviteStatus,
} from '../constants';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          skill_level: SkillLevel | null;
          profile_visibility: ProfileVisibility;
          phone: string | null;
          is_app_admin: boolean;
          city: string | null;
          city_lat: number | null;
          city_lng: number | null;
          dupr_rating: number | null;
          play_format: PlayFormat;
          ranked_preference: RankedPreference;
          available_now: boolean;
          available_until: string | null;
          discovery_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          profile_visibility?: ProfileVisibility;
          phone?: string | null;
          is_app_admin?: boolean;
          city?: string | null;
          city_lat?: number | null;
          city_lng?: number | null;
          dupr_rating?: number | null;
          play_format?: PlayFormat;
          ranked_preference?: RankedPreference;
          available_now?: boolean;
          available_until?: string | null;
          discovery_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          profile_visibility?: ProfileVisibility;
          phone?: string | null;
          is_app_admin?: boolean;
          city?: string | null;
          city_lat?: number | null;
          city_lng?: number | null;
          dupr_rating?: number | null;
          play_format?: PlayFormat;
          ranked_preference?: RankedPreference;
          available_now?: boolean;
          available_until?: string | null;
          discovery_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupMemberRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey',
            columns: ['group_id'],
            isOneToOne: false,
            referencedRelation: 'groups',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'group_members_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
      courts: {
        Row: {
          id: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          court_type: CourtType;
          num_courts: number;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          court_type?: CourtType;
          num_courts?: number;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          lat?: number;
          lng?: number;
          court_type?: CourtType;
          num_courts?: number;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          group_id: string | null;
          court_id: string;
          visibility: EventVisibility;
          starts_at: string;
          max_players: number | null;
          session_type: SessionType;
          skill_min: SkillLevel | null;
          skill_max: SkillLevel | null;
          description: string | null;
          lat: number | null;
          lng: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          court_id: string;
          visibility?: EventVisibility;
          starts_at: string;
          max_players?: number | null;
          session_type?: SessionType;
          skill_min?: SkillLevel | null;
          skill_max?: SkillLevel | null;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string | null;
          court_id?: string;
          visibility?: EventVisibility;
          starts_at?: string;
          max_players?: number | null;
          session_type?: SessionType;
          skill_min?: SkillLevel | null;
          skill_max?: SkillLevel | null;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_court_id_fkey',
            columns: ['court_id'],
            isOneToOne: false,
            referencedRelation: 'courts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'events_group_id_fkey',
            columns: ['group_id'],
            isOneToOne: false,
            referencedRelation: 'groups',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'events_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
      event_rsvps: {
        Row: {
          event_id: string;
          user_id: string;
          status: RsvpStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          status?: RsvpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          status?: RsvpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_rsvps_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'event_rsvps_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
      event_comments: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_comments_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'event_comments_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
      group_announcements: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          title: string;
          body: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          author_id: string;
          title: string;
          body: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          author_id?: string;
          title?: string;
          body?: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_announcements_author_id_fkey',
            columns: ['author_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'group_announcements_group_id_fkey',
            columns: ['group_id'],
            isOneToOne: false,
            referencedRelation: 'groups',
            referencedColumns: ['id'],
          },
        ];
      };
      match_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: MatchRequestStatus;
          message: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: MatchRequestStatus;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: MatchRequestStatus;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_requests_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_requests_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      player_conversations: {
        Row: {
          id: string;
          match_request_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_request_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_request_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_conversations_match_request_id_fkey';
            columns: ['match_request_id'];
            isOneToOne: true;
            referencedRelation: 'match_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      player_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'player_conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      session_invites: {
        Row: {
          id: string;
          event_id: string;
          invited_user_id: string;
          invited_by: string;
          status: SessionInviteStatus;
          message: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          invited_user_id: string;
          invited_by: string;
          status?: SessionInviteStatus;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          invited_user_id?: string;
          invited_by?: string;
          status?: SessionInviteStatus;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'session_invites_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_invites_invited_user_id_fkey';
            columns: ['invited_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_group_preview_by_invite_code: {
        Args: { p_invite_code: string };
        Returns: { id: string; name: string }[];
      };
      join_group_by_invite_code: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      discover_players: {
        Args: {
          viewer_lat?: number | null;
          viewer_lng?: number | null;
          radius_mi?: number | null;
          search_query?: string | null;
          skill_filter?: SkillLevel | null;
          format_filter?: PlayFormat | null;
        };
        Returns: {
          id: string;
          display_name: string;
          city: string | null;
          skill_level: SkillLevel;
          play_format: PlayFormat;
          ranked_preference: RankedPreference;
          available_now: boolean;
          distance_km: number | null;
        }[];
      };
    };
    Enums: {
      skill_level: SkillLevel;
      profile_visibility: ProfileVisibility;
      court_type: CourtType;
      session_type: SessionType;
      event_visibility: EventVisibility;
      rsvp_status: RsvpStatus;
      group_member_role: GroupMemberRole;
      play_format: PlayFormat;
      ranked_preference: RankedPreference;
      match_request_status: MatchRequestStatus;
      session_invite_status: SessionInviteStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MatchRequest = Database['public']['Tables']['match_requests']['Row'];
export type PlayerConversation = Database['public']['Tables']['player_conversations']['Row'];
export type PlayerMessage = Database['public']['Tables']['player_messages']['Row'];
export type SessionInvite = Database['public']['Tables']['session_invites']['Row'];
