import type {
  SkillLevel,
  CourtType,
  SessionType,
  RsvpStatus,
  UserNotificationType,
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
          phone: string | null;
          is_app_admin: boolean;
          city: string | null;
          city_lat: number | null;
          city_lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          phone?: string | null;
          is_app_admin?: boolean;
          city?: string | null;
          city_lat?: number | null;
          city_lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          phone?: string | null;
          is_app_admin?: boolean;
          city?: string | null;
          city_lat?: number | null;
          city_lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          court_id: string;
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
          court_id: string;
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
          court_id?: string;
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
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: UserNotificationType;
          title: string;
          body: string;
          event_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: UserNotificationType;
          title: string;
          body?: string;
          event_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: UserNotificationType;
          title?: string;
          body?: string;
          event_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_notifications_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'user_notifications_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      event_attendees: {
        Args: { p_event_id: string };
        Returns: {
          user_id: string;
          status: RsvpStatus;
          display_name: string;
          avatar_url: string | null;
          skill_level: SkillLevel | null;
        }[];
      };
      rsvp_to_event: {
        Args: { p_event_id: string; p_status: RsvpStatus };
        Returns: RsvpStatus;
      };
      search_events: {
        Args: {
          viewer_lat?: number | null;
          viewer_lng?: number | null;
          radius_mi?: number | null;
          search_query?: string | null;
          skill_filter?: SkillLevel | null;
          session_type_filter?: SessionType | null;
          starts_before?: string | null;
          exclude_user_id?: string | null;
          max_results?: number | null;
        };
        Returns: {
          id: string;
          court_id: string;
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
          court_name: string | null;
          court_address: string | null;
          court_num_courts: number | null;
          going_count: number;
          distance_km: number | null;
        }[];
      };
    };
    Enums: {
      skill_level: SkillLevel;
      court_type: CourtType;
      session_type: SessionType;
      rsvp_status: RsvpStatus;
      user_notification_type: UserNotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserNotification = Database['public']['Tables']['user_notifications']['Row'];
