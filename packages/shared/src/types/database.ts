import type { SkillLevel, ProfileVisibility, CourtType, SessionType, EventVisibility, RsvpStatus, GroupMemberRole } from '../constants';

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
        Relationships: [];
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
        Relationships: [];
      };
      courts: {
        Row: {
          id: string;
          group_id: string | null;
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
          group_id?: string | null;
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
          group_id?: string | null;
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
    };
    Enums: {
      skill_level: SkillLevel;
      profile_visibility: ProfileVisibility;
      court_type: CourtType;
      session_type: SessionType;
      event_visibility: EventVisibility;
      rsvp_status: RsvpStatus;
      group_member_role: GroupMemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
