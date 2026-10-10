// Généré depuis Supabase (generate_typescript_types), réduit aux tables utilisées.
// Pour régénérer : npx supabase gen types typescript --project-id fjbrqsofnruqmqdprert > src/lib/database.types.ts

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' };
  public: {
    Tables: {
      consents: {
        Row: { created_at: string; granted: boolean; id: number; kind: string; policy_version: string; user_id: string };
        Insert: { created_at?: string; granted: boolean; id?: never; kind: string; policy_version: string; user_id?: string };
        Update: { created_at?: string; granted?: boolean; id?: never; kind?: string; policy_version?: string; user_id?: string };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          client_updated_at: string;
          comfort: number | null;
          created_at: string;
          heaviness: number | null;
          id: string;
          log_date: string;
          note: string | null;
          swelling: number | null;
          updated_at: string;
          user_id: string;
          water_glasses: number | null;
          wear_slot: string | null;
          worn_hours: number | null;
        };
        Insert: {
          client_updated_at?: string;
          comfort?: number | null;
          created_at?: string;
          heaviness?: number | null;
          id?: string;
          log_date: string;
          note?: string | null;
          swelling?: number | null;
          updated_at?: string;
          user_id?: string;
          water_glasses?: number | null;
          wear_slot?: string | null;
          worn_hours?: number | null;
        };
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>;
        Relationships: [];
      };
      linked_orders: {
        Row: {
          created_at: string;
          delivered_at: string | null;
          id: string;
          legging_size: string | null;
          order_name: string;
          purchased_at: string | null;
          shopify_order_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          legging_size?: string | null;
          order_name: string;
          purchased_at?: string | null;
          shopify_order_id: string;
          status?: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['linked_orders']['Insert']>;
        Relationships: [];
      };
      measurements: {
        Row: {
          client_updated_at: string;
          created_at: string;
          id: string;
          kind: string;
          measured_on: string;
          updated_at: string;
          user_id: string;
          value_cm: number;
        };
        Insert: {
          client_updated_at?: string;
          created_at?: string;
          id?: string;
          kind: string;
          measured_on: string;
          updated_at?: string;
          user_id?: string;
          value_cm: number;
        };
        Update: Partial<Database['public']['Tables']['measurements']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          activity_profile: string | null;
          created_at: string;
          first_name: string | null;
          goals: string[];
          id: string;
          legging_size: string | null;
          locale: string;
          onboarded_at: string | null;
          reminder_time: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          activity_profile?: string | null;
          created_at?: string;
          first_name?: string | null;
          goals?: string[];
          id: string;
          legging_size?: string | null;
          locale?: string;
          onboarded_at?: string | null;
          reminder_time?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      program_progress: {
        Row: { completed_at: string; day_index: number; program_slug: string; user_id: string };
        Insert: { completed_at?: string; day_index: number; program_slug: string; user_id?: string };
        Update: { completed_at?: string; day_index?: number; program_slug?: string; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
