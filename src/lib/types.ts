export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  onboarded: boolean
  ojt_target_hours: number | null
  created_at: string
  updated_at: string
}

export interface WorkLocation {
  id: string
  user_id: string
  label: string
  place_name: string | null
  address: string | null
  city: string | null
  region: string | null
  country: string | null
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

export interface AttendanceLog {
  id: string
  user_id: string
  work_location_id: string | null
  work_date: string
  clock_in_at: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_in_distance_m: number | null
  title: string | null
  clock_in_notes: string | null
  clock_in_photo_url: string | null
  clock_out_at: string | null
  clock_out_notes: string | null
  clock_out_photo_url: string | null
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
}

// Minimal Database typing for the supabase client generic.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      work_locations: {
        Row: WorkLocation
        Insert: Partial<WorkLocation>
        Update: Partial<WorkLocation>
      }
      attendance_logs: {
        Row: AttendanceLog
        Insert: Partial<AttendanceLog>
        Update: Partial<AttendanceLog>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
