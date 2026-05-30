export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action_type: string | null
          id: string
          logged_at: string
          outcome: Json
          page: string | null
          step: string
          user_id: string | null
          user_name: string | null
          wedding_id: string
        }
        Insert: {
          action_type?: string | null
          id?: string
          logged_at?: string
          outcome: Json
          page?: string | null
          step: string
          user_id?: string | null
          user_name?: string | null
          wedding_id: string
        }
        Update: {
          action_type?: string | null
          id?: string
          logged_at?: string
          outcome?: Json
          page?: string | null
          step?: string
          user_id?: string | null
          user_name?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      anniversary_emails_sent: {
        Row: {
          event_id: string
          id: string
          sent_at: string
          year_number: number
        }
        Insert: {
          event_id: string
          id?: string
          sent_at?: string
          year_number: number
        }
        Update: {
          event_id?: string
          id?: string
          sent_at?: string
          year_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "anniversary_emails_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anniversary_emails_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anniversary_emails_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anniversary_emails_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      app_event_types: {
        Row: {
          calendar_color: string
          contact_label: string
          contact_schema: string | null
          created_at: string
          emoji: string
          form_label: string
          id: string
          is_active: boolean
          label: string
          portal_name: string | null
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          calendar_color?: string
          contact_label?: string
          contact_schema?: string | null
          created_at?: string
          emoji?: string
          form_label?: string
          id?: string
          is_active?: boolean
          label: string
          portal_name?: string | null
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          calendar_color?: string
          contact_label?: string
          contact_schema?: string | null
          created_at?: string
          emoji?: string
          form_label?: string
          id?: string
          is_active?: boolean
          label?: string
          portal_name?: string | null
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          message: string
          page_url: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message: string
          page_url?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message?: string
          page_url?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_meeting_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_package_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_pricing_defaults: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      app_upgrade_packages: {
        Row: {
          created_at: string
          description: string | null
          features: string[]
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      assignment_costs: {
        Row: {
          admin_markup_percent: number
          assignment_id: string
          client_price: number
          created_at: string
          hours_booked: number | null
          id: string
          notes: string | null
          overtime_hours: number | null
          payment_status: string
          total_client_price: number
          total_vendor_cost: number
          updated_at: string
          vendor_rate: number
        }
        Insert: {
          admin_markup_percent?: number
          assignment_id: string
          client_price: number
          created_at?: string
          hours_booked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payment_status?: string
          total_client_price: number
          total_vendor_cost: number
          updated_at?: string
          vendor_rate: number
        }
        Update: {
          admin_markup_percent?: number
          assignment_id?: string
          client_price?: number
          created_at?: string
          hours_booked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payment_status?: string
          total_client_price?: number
          total_vendor_cost?: number
          updated_at?: string
          vendor_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_costs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "event_dj_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_invite_tokens: {
        Row: {
          booking_request_id: string
          client_email: string
          client_name: string
          created_at: string
          event_date: string | null
          event_type: string | null
          expires_at: string | null
          id: string
          token: string
          used_at: string | null
          used_by: string | null
          vendor_id: string
          vendor_type: string | null
        }
        Insert: {
          booking_request_id: string
          client_email: string
          client_name: string
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
          vendor_id: string
          vendor_type?: string | null
        }
        Update: {
          booking_request_id?: string
          client_email?: string
          client_name?: string
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
          vendor_id?: string
          vendor_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_invite_tokens_booking_request_id_fkey"
            columns: ["booking_request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_invite_tokens_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_invite_tokens_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_invite_tokens_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          event_date: string | null
          event_type: string | null
          id: string
          message: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          booking_date: string
          booking_time: string
          created_at: string
          customer_notes: string | null
          google_event_id: string | null
          id: string
          meeting_format: string | null
          meeting_link: string | null
          meeting_type: string
          reminder_sent: boolean | null
          status: string
          updated_at: string
          vendor_id: string | null
          vendor_notes: string | null
          vendor_rsvp: string | null
          vendor_rsvp_at: string | null
          wedding_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_date: string
          booking_time: string
          created_at?: string
          customer_notes?: string | null
          google_event_id?: string | null
          id?: string
          meeting_format?: string | null
          meeting_link?: string | null
          meeting_type?: string
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_notes?: string | null
          vendor_rsvp?: string | null
          vendor_rsvp_at?: string | null
          wedding_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_notes?: string | null
          google_event_id?: string | null
          id?: string
          meeting_format?: string | null
          meeting_link?: string | null
          meeting_type?: string
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_notes?: string | null
          vendor_rsvp?: string | null
          vendor_rsvp_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          admin_notes: string | null
          browser_info: string | null
          category: string
          created_at: string
          description: string
          id: string
          page_url: string | null
          screenshot_url: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          browser_info?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          browser_info?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          sender_name: string | null
          sender_role: string
          wedding_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          sender_name?: string | null
          sender_role: string
          wedding_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_role?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          approved: boolean | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          event_type: string | null
          google_review_clicked: boolean | null
          id: string
          rating: number
          review_text: string
          reviewer_email: string
          reviewer_name: string
          updated_at: string | null
          video_path: string | null
          wedding_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          google_review_clicked?: boolean | null
          id?: string
          rating: number
          review_text: string
          reviewer_email: string
          reviewer_name: string
          updated_at?: string | null
          video_path?: string | null
          wedding_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          google_review_clicked?: boolean | null
          id?: string
          rating?: number
          review_text?: string
          reviewer_email?: string
          reviewer_name?: string
          updated_at?: string | null
          video_path?: string | null
          wedding_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          notification_sent_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          notification_sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          notification_sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coordinator_settings: {
        Row: {
          created_at: string
          emergency_contacts: string | null
          id: string
          timeline_preferences: string | null
          updated_at: string
          user_id: string
          vendor_coordination_notes: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          emergency_contacts?: string | null
          id?: string
          timeline_preferences?: string | null
          updated_at?: string
          user_id: string
          vendor_coordination_notes?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          emergency_contacts?: string | null
          id?: string
          timeline_preferences?: string | null
          updated_at?: string
          user_id?: string
          vendor_coordination_notes?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordinator_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_codes: {
        Row: {
          active: boolean | null
          bride_email: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          groom_email: string | null
          id: string
          used_at: string | null
          used_by: string | null
          wedding_id: string
        }
        Insert: {
          active?: boolean | null
          bride_email?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          groom_email?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
          wedding_id: string
        }
        Update: {
          active?: boolean | null
          bride_email?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          groom_email?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_codes_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_codes_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_codes_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_codes_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_venues: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          dress_code: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          dress_code?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          dress_code?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          wedding_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          wedding_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          invited_company: string | null
          invited_email: string | null
          invited_first_name: string | null
          invited_last_name: string | null
          invited_role: string | null
          last_used_at: string | null
          name: string
          notes: string | null
          phone: string | null
          used_at: string | null
          used_by: string | null
          user_id: number
          vendor_type: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_company?: string | null
          invited_email?: string | null
          invited_first_name?: string | null
          invited_last_name?: string | null
          invited_role?: string | null
          last_used_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id: number
          vendor_type?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_company?: string | null
          invited_email?: string | null
          invited_first_name?: string | null
          invited_last_name?: string | null
          invited_role?: string | null
          last_used_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id?: number
          vendor_type?: string | null
        }
        Relationships: []
      }
      dj_settings: {
        Row: {
          arrival_preferences: string | null
          created_at: string
          equipment_notes: string | null
          id: string
          sound_restrictions: string | null
          updated_at: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          arrival_preferences?: string | null
          created_at?: string
          equipment_notes?: string | null
          id?: string
          sound_restrictions?: string | null
          updated_at?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          arrival_preferences?: string | null
          created_at?: string
          equipment_notes?: string | null
          id?: string
          sound_restrictions?: string | null
          updated_at?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          event_id: string | null
          file_path: string | null
          id: string
          parsed_json: Json | null
          raw_text: string | null
          received_at: string | null
          source: string
          type: string
        }
        Insert: {
          event_id?: string | null
          file_path?: string | null
          id?: string
          parsed_json?: Json | null
          raw_text?: string | null
          received_at?: string | null
          source?: string
          type: string
        }
        Update: {
          event_id?: string | null
          file_path?: string | null
          id?: string
          parsed_json?: Json | null
          raw_text?: string | null
          received_at?: string | null
          source?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          body: string
          event_id: string | null
          id: string
          sent_at: string | null
          status: string
          thread_id: string | null
        }
        Insert: {
          body: string
          event_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Update: {
          body?: string
          event_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body: string | null
          category: string
          from_address: string | null
          has_attachments: boolean | null
          id: string
          received_at: string | null
          thread_id: string | null
          zoho_message_id: string | null
        }
        Insert: {
          body?: string | null
          category?: string
          from_address?: string | null
          has_attachments?: boolean | null
          id?: string
          received_at?: string | null
          thread_id?: string | null
          zoho_message_id?: string | null
        }
        Update: {
          body?: string | null
          category?: string
          from_address?: string | null
          has_attachments?: boolean | null
          id?: string
          received_at?: string | null
          thread_id?: string | null
          zoho_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          event_id: string | null
          id: string
          last_message_at: string | null
          participants: string[] | null
          subject: string | null
          zoho_thread_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          participants?: string[] | null
          subject?: string | null
          zoho_thread_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          participants?: string[] | null
          subject?: string | null
          zoho_thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_dj_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_notes: string | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          confirmed_at: string | null
          created_at: string | null
          declined_reason: string | null
          dj_user_id: string
          event_id: string
          event_notification_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          vendor_files_uploaded: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          declined_reason?: string | null
          dj_user_id: string
          event_id: string
          event_notification_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_files_uploaded?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          declined_reason?: string | null
          dj_user_id?: string
          event_id?: string
          event_notification_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_files_uploaded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_dj_assignments_dj_user_id_fkey"
            columns: ["dj_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_dj_user_id_fkey"
            columns: ["dj_user_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_dj_user_id_fkey"
            columns: ["dj_user_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_notification_id_fkey"
            columns: ["event_notification_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_notification_id_fkey"
            columns: ["event_notification_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_notification_id_fkey"
            columns: ["event_notification_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dj_assignments_event_notification_id_fkey"
            columns: ["event_notification_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notification_history: {
        Row: {
          additional_metadata: Json | null
          assigned_vendor_id: string | null
          balance_due: number | null
          balance_paid: boolean | null
          balance_paid_at: string | null
          booking_source: string | null
          bride_email: string | null
          captcha_score: number | null
          client_name: string | null
          client_signature_date: string | null
          client_signature_name: string | null
          contact_email: string
          contact_phone: string | null
          contract_signature_data: string | null
          contract_signed: boolean | null
          contract_signed_at: string | null
          coordinator_name: string | null
          couple_name: string
          created_at: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          deposit_reminder_sent: boolean | null
          deposit_reminder_sent_at: string | null
          dj_meal_included: boolean | null
          dj_name: string | null
          dress_code: string | null
          edit_count: number | null
          edited_at: string | null
          end_time: string | null
          event_date: string
          event_type: string
          file_uploaded: boolean | null
          form_progress: number | null
          google_event_id: string | null
          groom_email: string | null
          guest_count: number | null
          honoree_name: string | null
          hourly_rate: number | null
          hours_booked: number | null
          id: string
          ip_address: string | null
          is_test: boolean | null
          last_resent_at: string | null
          notes: string | null
          overtime_rate: number | null
          package_type: string | null
          payment_required: boolean | null
          pricing_type: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          printed_at: string | null
          resend_count: number | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          start_time: string | null
          status: string
          stripe_payment_intent_id: string | null
          submission_ip: string | null
          submitted_by: string
          submitted_by_user_id: string | null
          total_price: number | null
          updated_at: string
          user_agent: string | null
          venue: string | null
          venue_address: string | null
          webhook_response: string | null
          webhook_status_code: number | null
          webhook_url: string | null
          wedding_id: string | null
        }
        Insert: {
          additional_metadata?: Json | null
          assigned_vendor_id?: string | null
          balance_due?: number | null
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          booking_source?: string | null
          bride_email?: string | null
          captcha_score?: number | null
          client_name?: string | null
          client_signature_date?: string | null
          client_signature_name?: string | null
          contact_email: string
          contact_phone?: string | null
          contract_signature_data?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          coordinator_name?: string | null
          couple_name: string
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_reminder_sent?: boolean | null
          deposit_reminder_sent_at?: string | null
          dj_meal_included?: boolean | null
          dj_name?: string | null
          dress_code?: string | null
          edit_count?: number | null
          edited_at?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          file_uploaded?: boolean | null
          form_progress?: number | null
          google_event_id?: string | null
          groom_email?: string | null
          guest_count?: number | null
          honoree_name?: string | null
          hourly_rate?: number | null
          hours_booked?: number | null
          id?: string
          ip_address?: string | null
          is_test?: boolean | null
          last_resent_at?: string | null
          notes?: string | null
          overtime_rate?: number | null
          package_type?: string | null
          payment_required?: boolean | null
          pricing_type?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          printed_at?: string | null
          resend_count?: number | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          start_time?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          submission_ip?: string | null
          submitted_by: string
          submitted_by_user_id?: string | null
          total_price?: number | null
          updated_at?: string
          user_agent?: string | null
          venue?: string | null
          venue_address?: string | null
          webhook_response?: string | null
          webhook_status_code?: number | null
          webhook_url?: string | null
          wedding_id?: string | null
        }
        Update: {
          additional_metadata?: Json | null
          assigned_vendor_id?: string | null
          balance_due?: number | null
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          booking_source?: string | null
          bride_email?: string | null
          captcha_score?: number | null
          client_name?: string | null
          client_signature_date?: string | null
          client_signature_name?: string | null
          contact_email?: string
          contact_phone?: string | null
          contract_signature_data?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          coordinator_name?: string | null
          couple_name?: string
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_reminder_sent?: boolean | null
          deposit_reminder_sent_at?: string | null
          dj_meal_included?: boolean | null
          dj_name?: string | null
          dress_code?: string | null
          edit_count?: number | null
          edited_at?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          file_uploaded?: boolean | null
          form_progress?: number | null
          google_event_id?: string | null
          groom_email?: string | null
          guest_count?: number | null
          honoree_name?: string | null
          hourly_rate?: number | null
          hours_booked?: number | null
          id?: string
          ip_address?: string | null
          is_test?: boolean | null
          last_resent_at?: string | null
          notes?: string | null
          overtime_rate?: number | null
          package_type?: string | null
          payment_required?: boolean | null
          pricing_type?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          printed_at?: string | null
          resend_count?: number | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          start_time?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          submission_ip?: string | null
          submitted_by?: string
          submitted_by_user_id?: string | null
          total_price?: number | null
          updated_at?: string
          user_agent?: string | null
          venue?: string | null
          venue_address?: string | null
          webhook_response?: string | null
          webhook_status_code?: number | null
          webhook_url?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_post_reports: {
        Row: {
          coordinator_notes: string | null
          coordinator_rating: number | null
          created_at: string | null
          crowd_age_range: string | null
          energy_level: number | null
          estimated_crowd_size: number | null
          event_id: string
          highlight_notes: string | null
          hit_songs: string[] | null
          id: string
          missed_songs: string[] | null
          overall_rating: number | null
          reported_by: string | null
          top_genres: string[] | null
          updated_at: string | null
          venue_lighting_rating: number | null
          venue_notes: string | null
          venue_sound_rating: number | null
          would_book_venue_again: boolean | null
        }
        Insert: {
          coordinator_notes?: string | null
          coordinator_rating?: number | null
          created_at?: string | null
          crowd_age_range?: string | null
          energy_level?: number | null
          estimated_crowd_size?: number | null
          event_id: string
          highlight_notes?: string | null
          hit_songs?: string[] | null
          id?: string
          missed_songs?: string[] | null
          overall_rating?: number | null
          reported_by?: string | null
          top_genres?: string[] | null
          updated_at?: string | null
          venue_lighting_rating?: number | null
          venue_notes?: string | null
          venue_sound_rating?: number | null
          would_book_venue_again?: boolean | null
        }
        Update: {
          coordinator_notes?: string | null
          coordinator_rating?: number | null
          created_at?: string | null
          crowd_age_range?: string | null
          energy_level?: number | null
          estimated_crowd_size?: number | null
          event_id?: string
          highlight_notes?: string | null
          hit_songs?: string[] | null
          id?: string
          missed_songs?: string[] | null
          overall_rating?: number | null
          reported_by?: string | null
          top_genres?: string[] | null
          updated_at?: string | null
          venue_lighting_rating?: number | null
          venue_notes?: string | null
          venue_sound_rating?: number | null
          would_book_venue_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_post_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_post_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_post_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_post_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      event_timeline_items: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          end_time: string | null
          event_id: string
          id: string
          label: string
          notes: string | null
          sort_order: number | null
          start_time: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          label: string
          notes?: string | null
          sort_order?: number | null
          start_time: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          label?: string
          notes?: string | null
          sort_order?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_timeline_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      event_update_requests: {
        Row: {
          created_at: string | null
          event_id: string
          field_name: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          suggested_value: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          field_name: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          suggested_value?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          field_name?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          suggested_value?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_update_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_update_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_update_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_update_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_name: string
          created_at: string | null
          event_date: string | null
          event_type: string | null
          id: string
          notes: string | null
          portal_linked: boolean | null
          status: string
          venue: string | null
          zoho_invoice_id: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          portal_linked?: boolean | null
          status?: string
          venue?: string | null
          zoho_invoice_id?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          portal_linked?: boolean | null
          status?: string
          venue?: string | null
          zoho_invoice_id?: string | null
        }
        Relationships: []
      }
      extra_songs: {
        Row: {
          artist_name: string | null
          created_at: string | null
          id: string
          music_sheet_id: string | null
          note: string | null
          position: number | null
          song_name: string | null
        }
        Insert: {
          artist_name?: string | null
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          note?: string | null
          position?: number | null
          song_name?: string | null
        }
        Update: {
          artist_name?: string | null
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          note?: string | null
          position?: number | null
          song_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_songs_music_sheet_id_fkey"
            columns: ["music_sheet_id"]
            isOneToOne: false
            referencedRelation: "music_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          label: string
          sent_at: string | null
          sent_to_coordinator: boolean | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          label: string
          sent_at?: string | null
          sent_to_coordinator?: boolean | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          label?: string
          sent_at?: string | null
          sent_to_coordinator?: boolean | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          captcha_score: number | null
          contact_email: string
          contact_name: string
          created_at: string
          email_sent_at: string | null
          form_data: Json
          form_template_id: string
          id: string
          metadata: Json | null
          pdf_generated_at: string | null
          status: string
          submission_ip: string | null
          submitted_at: string | null
          updated_at: string
          webhook_sent_at: string | null
          webhook_url: string | null
          wedding_id: string
        }
        Insert: {
          captcha_score?: number | null
          contact_email: string
          contact_name: string
          created_at?: string
          email_sent_at?: string | null
          form_data: Json
          form_template_id: string
          id?: string
          metadata?: Json | null
          pdf_generated_at?: string | null
          status?: string
          submission_ip?: string | null
          submitted_at?: string | null
          updated_at?: string
          webhook_sent_at?: string | null
          webhook_url?: string | null
          wedding_id: string
        }
        Update: {
          captcha_score?: number | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          email_sent_at?: string | null
          form_data?: Json
          form_template_id?: string
          id?: string
          metadata?: Json | null
          pdf_generated_at?: string | null
          status?: string
          submission_ip?: string | null
          submitted_at?: string | null
          updated_at?: string
          webhook_sent_at?: string | null
          webhook_url?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          form_type: string
          id: string
          is_active: boolean
          name: string
          template_config: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_type: string
          id?: string
          is_active?: boolean
          name: string
          template_config: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_type?: string
          id?: string
          is_active?: boolean
          name?: string
          template_config?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grand_entrance_list: {
        Row: {
          created_at: string | null
          id: string
          music_sheet_id: string | null
          name: string | null
          pairing: string | null
          position: number | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          name?: string | null
          pairing?: string | null
          position?: number | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          name?: string | null
          pairing?: string | null
          position?: number | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grand_entrance_list_music_sheet_id_fkey"
            columns: ["music_sheet_id"]
            isOneToOne: false
            referencedRelation: "music_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      group_dances: {
        Row: {
          approved: boolean | null
          created_at: string | null
          dance_name: string | null
          id: string
          music_sheet_id: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          dance_name?: string | null
          id?: string
          music_sheet_id?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          dance_name?: string | null
          id?: string
          music_sheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_dances_music_sheet_id_fkey"
            columns: ["music_sheet_id"]
            isOneToOne: false
            referencedRelation: "music_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          external_invoice_id: string | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          wedding_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_invoice_id?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_invoice_id?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          id: string
          label: string
          link_type: string | null
          sent_at: string | null
          sent_to_coordinator: boolean | null
          url: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          link_type?: string | null
          sent_at?: string | null
          sent_to_coordinator?: boolean | null
          url: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          link_type?: string | null
          sent_at?: string | null
          sent_to_coordinator?: boolean | null
          url?: string
          wedding_id?: string
        }
        Relationships: []
      }
      meeting_summaries: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          booking_id: string
          created_at: string
          error_message: string | null
          id: string
          raw_transcript: string | null
          recording_duration_sec: number | null
          recording_url: string | null
          sent_at: string | null
          status: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          booking_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          raw_transcript?: string | null
          recording_duration_sec?: number | null
          recording_url?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          booking_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          raw_transcript?: string | null
          recording_duration_sec?: number | null
          recording_url?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcriptions: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          booking_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          raw_transcript: string
          recorded_by: string
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          booking_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          raw_transcript?: string
          recorded_by: string
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          booking_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          raw_transcript?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcriptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      music_preferences: {
        Row: {
          artist_name: string | null
          created_at: string | null
          id: string
          music_sheet_id: string | null
          song_name: string | null
          style_name: string | null
          type: string | null
        }
        Insert: {
          artist_name?: string | null
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          song_name?: string | null
          style_name?: string | null
          type?: string | null
        }
        Update: {
          artist_name?: string | null
          created_at?: string | null
          id?: string
          music_sheet_id?: string | null
          song_name?: string | null
          style_name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_preferences_music_sheet_id_fkey"
            columns: ["music_sheet_id"]
            isOneToOne: false
            referencedRelation: "music_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      music_sheet_changes: {
        Row: {
          change_type: string
          changed_by: string | null
          changes_summary: Json
          created_at: string
          id: string
          music_sheet_id: string
          wedding_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          changes_summary?: Json
          created_at?: string
          id?: string
          music_sheet_id: string
          wedding_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          changes_summary?: Json
          created_at?: string
          id?: string
          music_sheet_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_sheet_changes_music_sheet_id_fkey"
            columns: ["music_sheet_id"]
            isOneToOne: false
            referencedRelation: "music_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      music_sheet_uploads: {
        Row: {
          bride_email: string
          couple_name: string
          created_at: string
          dj_name: string
          event_date: string
          file_path: string
          file_url: string
          id: string
          notification_sent: boolean | null
          package_type: string
          uploaded_by: string
        }
        Insert: {
          bride_email?: string
          couple_name: string
          created_at?: string
          dj_name: string
          event_date: string
          file_path: string
          file_url: string
          id?: string
          notification_sent?: boolean | null
          package_type?: string
          uploaded_by: string
        }
        Update: {
          bride_email?: string
          couple_name?: string
          created_at?: string
          dj_name?: string
          event_date?: string
          file_path?: string
          file_url?: string
          id?: string
          notification_sent?: boolean | null
          package_type?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      music_sheets: {
        Row: {
          bride_entrance: string | null
          ceremony_details: Json | null
          created_at: string
          do_not_plays: string[] | null
          first_dance: string | null
          grand_entrance: string | null
          id: string
          last_dance: string | null
          must_plays: string[] | null
          notes: string | null
          playlist_links: Json | null
          processional: string | null
          reception_timeline_events: Json | null
          recessional: string | null
          song_requests: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          bride_entrance?: string | null
          ceremony_details?: Json | null
          created_at?: string
          do_not_plays?: string[] | null
          first_dance?: string | null
          grand_entrance?: string | null
          id?: string
          last_dance?: string | null
          must_plays?: string[] | null
          notes?: string | null
          playlist_links?: Json | null
          processional?: string | null
          reception_timeline_events?: Json | null
          recessional?: string | null
          song_requests?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          bride_entrance?: string | null
          ceremony_details?: Json | null
          created_at?: string
          do_not_plays?: string[] | null
          first_dance?: string | null
          grand_entrance?: string | null
          id?: string
          last_dance?: string | null
          must_plays?: string[] | null
          notes?: string | null
          playlist_links?: Json | null
          processional?: string | null
          reception_timeline_events?: Json | null
          recessional?: string | null
          song_requests?: string | null
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_sheets_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          wedding_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          wedding_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invitations: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          expires_at: string | null
          id: string
          invited_email: string | null
          invited_name: string | null
          token: string
          used: boolean | null
          used_at: string | null
          used_by_user_id: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          invited_email?: string | null
          invited_name?: string | null
          token?: string
          used?: boolean | null
          used_at?: string | null
          used_by_user_id?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          invited_email?: string | null
          invited_name?: string | null
          token?: string
          used?: boolean | null
          used_at?: string | null
          used_by_user_id?: string | null
          wedding_id?: string
        }
        Relationships: []
      }
      pricing: {
        Row: {
          base_price: number
          id: string
          notes: string | null
          service_name: string
        }
        Insert: {
          base_price: number
          id?: string
          notes?: string | null
          service_name: string
        }
        Update: {
          base_price?: number
          id?: string
          notes?: string | null
          service_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          company_name: string | null
          created_at: string
          email: string | null
          equipment_notes: string | null
          events_completed: number | null
          first_name: string | null
          id: string
          instagram_handle: string | null
          internal_notes: string | null
          is_active: boolean | null
          is_coordinator: boolean | null
          last_name: string | null
          phone: string | null
          price_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          service_area: string[] | null
          specialties: Json | null
          starting_price: number | null
          total_reviews: number | null
          tour_completed: boolean | null
          tour_version: number | null
          vendor_rating: number | null
          vendor_status: string | null
          vendor_type: string | null
          vendor_types: string[] | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          equipment_notes?: string | null
          events_completed?: number | null
          first_name?: string | null
          id: string
          instagram_handle?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_coordinator?: boolean | null
          last_name?: string | null
          phone?: string | null
          price_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_area?: string[] | null
          specialties?: Json | null
          starting_price?: number | null
          total_reviews?: number | null
          tour_completed?: boolean | null
          tour_version?: number | null
          vendor_rating?: number | null
          vendor_status?: string | null
          vendor_type?: string | null
          vendor_types?: string[] | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          equipment_notes?: string | null
          events_completed?: number | null
          first_name?: string | null
          id?: string
          instagram_handle?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_coordinator?: boolean | null
          last_name?: string | null
          phone?: string | null
          price_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_area?: string[] | null
          specialties?: Json | null
          starting_price?: number | null
          total_reviews?: number | null
          tour_completed?: boolean | null
          tour_version?: number | null
          vendor_rating?: number | null
          vendor_status?: string | null
          vendor_type?: string | null
          vendor_types?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_info: Json | null
          endpoint: string
          id: string
          last_used_at: string
          p256dh_key: string
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_info?: Json | null
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh_key: string
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_info?: Json | null
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          completed_at: string | null
          contact_email: string
          contact_name: string
          created_at: string
          created_by: string | null
          event_context: Json | null
          generated_message: string | null
          id: string
          message_template: string | null
          notes: string | null
          priority: string
          reminder_type: string
          scheduled_date: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          completed_at?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          created_by?: string | null
          event_context?: Json | null
          generated_message?: string | null
          id?: string
          message_template?: string | null
          notes?: string | null
          priority?: string
          reminder_type: string
          scheduled_date: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          completed_at?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          event_context?: Json | null
          generated_message?: string | null
          id?: string
          message_template?: string | null
          notes?: string | null
          priority?: string
          reminder_type?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_reminders_sent: {
        Row: {
          event_id: string
          id: string
          sent_at: string
        }
        Insert: {
          event_id: string
          id?: string
          sent_at?: string
        }
        Update: {
          event_id?: string
          id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spotify_connections: {
        Row: {
          access_token_secret_id: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token_secret_id: string | null
          spotify_user_id: string
          updated_at: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          access_token_secret_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token_secret_id?: string | null
          spotify_user_id: string
          updated_at?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          access_token_secret_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token_secret_id?: string | null
          spotify_user_id?: string
          updated_at?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          origin_url: string | null
          state_token: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          origin_url?: string | null
          state_token: string
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          origin_url?: string | null
          state_token?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          time: string
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          time: string
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          time?: string
          title?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_orders: {
        Row: {
          couple_name: string | null
          created_at: string
          emerald_choice: string | null
          id: string
          items: Json | null
          notes: string | null
          payment_status: string
          selected_package: string
          stripe_session_id: string | null
          total_amount: number | null
          updated_at: string
          wedding_date: string | null
          wedding_id: string
        }
        Insert: {
          couple_name?: string | null
          created_at?: string
          emerald_choice?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_status?: string
          selected_package: string
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          wedding_date?: string | null
          wedding_id: string
        }
        Update: {
          couple_name?: string | null
          created_at?: string
          emerald_choice?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_status?: string
          selected_package?: string
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          wedding_date?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_orders_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_orders_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_orders_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_orders_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrades: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      uploaded_details_forms: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string
          uploaded_by: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_details_forms_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_details_forms_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_details_forms_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_details_forms_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          vendor_id: string
          year: number | null
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          vendor_id: string
          year?: number | null
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          vendor_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_achievements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_achievements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_achievements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_add_ons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_add_ons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_add_ons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_add_ons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_assignment_reminders: {
        Row: {
          assignment_id: string
          email_status: string
          error_message: string | null
          event_id: string
          id: string
          milestone: string
          sent_at: string
          vendor_user_id: string
        }
        Insert: {
          assignment_id: string
          email_status?: string
          error_message?: string | null
          event_id: string
          id?: string
          milestone: string
          sent_at?: string
          vendor_user_id: string
        }
        Update: {
          assignment_id?: string
          email_status?: string
          error_message?: string | null
          event_id?: string
          id?: string
          milestone?: string
          sent_at?: string
          vendor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_assignment_reminders_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "event_dj_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_availability_blocks: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_flexible: boolean | null
          notes: string | null
          reason: string
          start_date: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_flexible?: boolean | null
          notes?: string | null
          reason?: string
          start_date: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_flexible?: boolean | null
          notes?: string | null
          reason?: string
          start_date?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_blocks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_blocks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_blocks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_blackout_dates: {
        Row: {
          blackout_date: string
          created_at: string
          id: string
          vendor_id: string
        }
        Insert: {
          blackout_date: string
          created_at?: string
          id?: string
          vendor_id: string
        }
        Update: {
          blackout_date?: string
          created_at?: string
          id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_blackout_dates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_blackout_dates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_blackout_dates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_client_assignments: {
        Row: {
          client_email: string
          client_user_id: string
          created_at: string
          event_id: string | null
          id: string
          invitation_id: string | null
          status: string
          updated_at: string
          vendor_id: string
          vendor_type: string
        }
        Insert: {
          client_email?: string
          client_user_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          invitation_id?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          vendor_type?: string
        }
        Update: {
          client_email?: string
          client_user_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          invitation_id?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          vendor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_client_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "vendor_client_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_client_invitations: {
        Row: {
          active: boolean
          client_email: string
          client_name: string
          code: string
          created_at: string
          event_id: string | null
          expires_at: string | null
          id: string
          used_at: string | null
          used_by: string | null
          vendor_id: string
          vendor_type: string
        }
        Insert: {
          active?: boolean
          client_email?: string
          client_name?: string
          code: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
          vendor_id: string
          vendor_type?: string
        }
        Update: {
          active?: boolean
          client_email?: string
          client_name?: string
          code?: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
          vendor_id?: string
          vendor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_client_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_invitations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_client_preferences: {
        Row: {
          assignment_id: string
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          preferences: Json
          submitted_at: string | null
          updated_at: string
          vendor_type: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          preferences?: Json
          submitted_at?: string | null
          updated_at?: string
          vendor_type?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          preferences?: Json
          submitted_at?: string | null
          updated_at?: string
          vendor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_client_preferences_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "vendor_client_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_preferences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_preferences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_preferences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_client_preferences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contract_templates: {
        Row: {
          body_html: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          body_html?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contract_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contracts: {
        Row: {
          body_html: string
          created_at: string
          event_id: string | null
          expires_at: string | null
          id: string
          sent_at: string | null
          sign_token: string
          signature_data: string | null
          signature_ip: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          vendor_id: string
          viewed_at: string | null
        }
        Insert: {
          body_html?: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          sent_at?: string | null
          sign_token?: string
          signature_data?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          vendor_id: string
          viewed_at?: string | null
        }
        Update: {
          body_html?: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          sent_at?: string | null
          sign_token?: string
          signature_data?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "vendor_contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          updated_at: string | null
          uploaded_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_email_templates: {
        Row: {
          body_html: string
          brand_color: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          cta_text: string
          cta_url: string | null
          greeting: string
          id: string
          logo_url: string | null
          signoff_text: string
          subject_template: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          body_html?: string
          brand_color?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          cta_text?: string
          cta_url?: string | null
          greeting?: string
          id?: string
          logo_url?: string | null
          signoff_text?: string
          subject_template?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          body_html?: string
          brand_color?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          cta_text?: string
          cta_url?: string | null
          greeting?: string
          id?: string
          logo_url?: string | null
          signoff_text?: string
          subject_template?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_email_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_email_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_email_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_event_rates: {
        Row: {
          created_at: string
          event_type: string
          id: string
          notes: string | null
          rate_modifier: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          rate_modifier?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          rate_modifier?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_event_rates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_event_rates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_event_rates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_event_uploads: {
        Row: {
          category: string | null
          created_at: string
          event_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          event_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_event_uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_event_uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_event_uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_event_uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_packages: {
        Row: {
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_pages: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string | null
          custom_sections: Json | null
          gallery_photos: Json | null
          headline: string | null
          highlight_reviews: boolean | null
          highlight_services: boolean | null
          id: string
          profile_photo_url: string | null
          show_pricing: boolean | null
          slug: string | null
          status: string | null
          submitted_at: string | null
          theme_color: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          gallery_photos?: Json | null
          headline?: string | null
          highlight_reviews?: boolean | null
          highlight_services?: boolean | null
          id?: string
          profile_photo_url?: string | null
          show_pricing?: boolean | null
          slug?: string | null
          status?: string | null
          submitted_at?: string | null
          theme_color?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          gallery_photos?: Json | null
          headline?: string | null
          highlight_reviews?: boolean | null
          highlight_services?: boolean | null
          id?: string
          profile_photo_url?: string | null
          show_pricing?: boolean | null
          slug?: string | null
          status?: string | null
          submitted_at?: string | null
          theme_color?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          assignment_id: string
          communication_rating: number | null
          created_at: string
          id: string
          professionalism_rating: number | null
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          review_text: string | null
          reviewed_at: string
          reviewer_id: string
          updated_at: string
          vendor_id: string
          would_hire_again: boolean
        }
        Insert: {
          assignment_id: string
          communication_rating?: number | null
          created_at?: string
          id?: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          review_text?: string | null
          reviewed_at?: string
          reviewer_id: string
          updated_at?: string
          vendor_id: string
          would_hire_again?: boolean
        }
        Update: {
          assignment_id?: string
          communication_rating?: number | null
          created_at?: string
          id?: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          review_text?: string | null
          reviewed_at?: string
          reviewer_id?: string
          updated_at?: string
          vendor_id?: string
          would_hire_again?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "event_dj_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          base_rate: number
          created_at: string
          id: string
          is_active: boolean
          min_hours: number | null
          notes: string | null
          overtime_rate: number | null
          rate_type: string
          service_type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          base_rate: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_hours?: number | null
          notes?: string | null
          overtime_rate?: number | null
          rate_type: string
          service_type: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_hours?: number | null
          notes?: string | null
          overtime_rate?: number | null
          rate_type?: string
          service_type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_stats: {
        Row: {
          avg_confirmation_hours: number | null
          confirmation_count: number | null
          created_at: string | null
          current_5star_streak: number | null
          current_event_streak: number | null
          decline_count: number | null
          first_event_date: string | null
          five_star_count: number | null
          id: string
          last_event_date: string | null
          last_event_month: string | null
          longest_5star_streak: number | null
          longest_event_streak: number | null
          perfect_5star_count: number | null
          total_birthdays: number | null
          total_corporate: number | null
          total_events: number | null
          total_other: number | null
          total_quinces: number | null
          total_weddings: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          avg_confirmation_hours?: number | null
          confirmation_count?: number | null
          created_at?: string | null
          current_5star_streak?: number | null
          current_event_streak?: number | null
          decline_count?: number | null
          first_event_date?: string | null
          five_star_count?: number | null
          id?: string
          last_event_date?: string | null
          last_event_month?: string | null
          longest_5star_streak?: number | null
          longest_event_streak?: number | null
          perfect_5star_count?: number | null
          total_birthdays?: number | null
          total_corporate?: number | null
          total_events?: number | null
          total_other?: number | null
          total_quinces?: number | null
          total_weddings?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          avg_confirmation_hours?: number | null
          confirmation_count?: number | null
          created_at?: string | null
          current_5star_streak?: number | null
          current_event_streak?: number | null
          decline_count?: number | null
          first_event_date?: string | null
          five_star_count?: number | null
          id?: string
          last_event_date?: string | null
          last_event_month?: string | null
          longest_5star_streak?: number | null
          longest_event_streak?: number | null
          perfect_5star_count?: number | null
          total_birthdays?: number | null
          total_corporate?: number | null
          total_events?: number | null
          total_other?: number | null
          total_quinces?: number | null
          total_weddings?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_stats_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_stats_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_stats_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_stats_yearly: {
        Row: {
          average_rating: number | null
          events_count: number | null
          id: string
          rank_in_year: number | null
          snapshot_date: string | null
          total_reviews: number | null
          vendor_id: string
          would_hire_again_pct: number | null
          year: number
        }
        Insert: {
          average_rating?: number | null
          events_count?: number | null
          id?: string
          rank_in_year?: number | null
          snapshot_date?: string | null
          total_reviews?: number | null
          vendor_id: string
          would_hire_again_pct?: number | null
          year: number
        }
        Update: {
          average_rating?: number | null
          events_count?: number | null
          id?: string
          rank_in_year?: number | null
          snapshot_date?: string | null
          total_reviews?: number | null
          vendor_id?: string
          would_hire_again_pct?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_stats_yearly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_stats_yearly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_stats_yearly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          arrival_time: string | null
          confirmed: boolean | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          wedding_id: string
        }
        Insert: {
          arrival_time?: string | null
          confirmed?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          wedding_id: string
        }
        Update: {
          arrival_time?: string | null
          confirmed?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
          vendor_type?: Database["public"]["Enums"]["vendor_type"]
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_partners: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_settings: {
        Row: {
          created_at: string
          id: string
          parking_info: string | null
          setup_notes: string | null
          special_requirements: string | null
          updated_at: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parking_info?: string | null
          setup_notes?: string | null
          special_requirements?: string | null
          updated_at?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parking_info?: string | null
          setup_notes?: string | null
          special_requirements?: string | null
          updated_at?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_sheets: {
        Row: {
          additional_songs: Json | null
          agenda_items: Json | null
          announcements: Json | null
          ceremony: Json | null
          ceremony_details: Json | null
          ceremony_timeline_events: Json | null
          created_at: string
          dj_email: string | null
          grand_intro: Json | null
          group_dances: Json | null
          id: string
          playlist_links: Json | null
          preferences: Json | null
          quince_ceremony_events: Json | null
          quince_reception_events: Json | null
          reception_timeline: Json | null
          reception_timeline_events: Json | null
          song_requests: string | null
          submitted_at: string | null
          toasts: Json | null
          updated_at: string
          venue_email: string | null
          wedding_id: string
        }
        Insert: {
          additional_songs?: Json | null
          agenda_items?: Json | null
          announcements?: Json | null
          ceremony?: Json | null
          ceremony_details?: Json | null
          ceremony_timeline_events?: Json | null
          created_at?: string
          dj_email?: string | null
          grand_intro?: Json | null
          group_dances?: Json | null
          id?: string
          playlist_links?: Json | null
          preferences?: Json | null
          quince_ceremony_events?: Json | null
          quince_reception_events?: Json | null
          reception_timeline?: Json | null
          reception_timeline_events?: Json | null
          song_requests?: string | null
          submitted_at?: string | null
          toasts?: Json | null
          updated_at?: string
          venue_email?: string | null
          wedding_id: string
        }
        Update: {
          additional_songs?: Json | null
          agenda_items?: Json | null
          announcements?: Json | null
          ceremony?: Json | null
          ceremony_details?: Json | null
          ceremony_timeline_events?: Json | null
          created_at?: string
          dj_email?: string | null
          grand_intro?: Json | null
          group_dances?: Json | null
          id?: string
          playlist_links?: Json | null
          preferences?: Json | null
          quince_ceremony_events?: Json | null
          quince_reception_events?: Json | null
          reception_timeline?: Json | null
          reception_timeline_events?: Json | null
          song_requests?: string | null
          submitted_at?: string | null
          toasts?: Json | null
          updated_at?: string
          venue_email?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_sheets_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibe_sheets_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibe_sheets_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibe_sheets_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_samples: {
        Row: {
          approved_text: string
          context_type: string | null
          created_at: string | null
          id: string
          original_draft: string
        }
        Insert: {
          approved_text: string
          context_type?: string | null
          created_at?: string | null
          id?: string
          original_draft: string
        }
        Update: {
          approved_text?: string
          context_type?: string | null
          created_at?: string | null
          id?: string
          original_draft?: string
        }
        Relationships: []
      }
      vp_scheduled_review_emails: {
        Row: {
          bride_first_name: string
          created_at: string
          email: string
          error: string | null
          event_date: string | null
          event_id: string | null
          groom_first_name: string
          id: string
          last_sent_at: string | null
          next_send_at: string | null
          reminder_number: number
          scheduled_batch: number
          sent_at: string | null
          status: string
          stopped: boolean
          stopped_reason: string | null
        }
        Insert: {
          bride_first_name: string
          created_at?: string
          email: string
          error?: string | null
          event_date?: string | null
          event_id?: string | null
          groom_first_name: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          reminder_number?: number
          scheduled_batch?: number
          sent_at?: string | null
          status?: string
          stopped?: boolean
          stopped_reason?: string | null
        }
        Update: {
          bride_first_name?: string
          created_at?: string
          email?: string
          error?: string | null
          event_date?: string | null
          event_id?: string | null
          groom_first_name?: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          reminder_number?: number
          scheduled_batch?: number
          sent_at?: string | null
          status?: string
          stopped?: boolean
          stopped_reason?: string | null
        }
        Relationships: []
      }
      wedding_coordinators: {
        Row: {
          coordinator_id: string | null
          created_at: string | null
          id: string
          wedding_id: string | null
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          wedding_id?: string | null
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_coordinators_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_details_submissions: {
        Row: {
          additional_notes: string | null
          bride_email: string | null
          bride_name: string | null
          bride_phone: string | null
          captcha_score: number | null
          catering_notes: string | null
          ceremony_time: string | null
          coordinator_name: string | null
          created_at: string
          dj_name: string | null
          event_date: string | null
          groom_email: string | null
          groom_name: string | null
          groom_phone: string | null
          guest_count: number | null
          id: string
          linens: Json | null
          metadata: Json
          music_notes: string | null
          reception_time: string | null
          signature_client: string | null
          signature_coordinator: string | null
          signed_at: string | null
          submission_ip: string | null
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          additional_notes?: string | null
          bride_email?: string | null
          bride_name?: string | null
          bride_phone?: string | null
          captcha_score?: number | null
          catering_notes?: string | null
          ceremony_time?: string | null
          coordinator_name?: string | null
          created_at?: string
          dj_name?: string | null
          event_date?: string | null
          groom_email?: string | null
          groom_name?: string | null
          groom_phone?: string | null
          guest_count?: number | null
          id?: string
          linens?: Json | null
          metadata?: Json
          music_notes?: string | null
          reception_time?: string | null
          signature_client?: string | null
          signature_coordinator?: string | null
          signed_at?: string | null
          submission_ip?: string | null
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          additional_notes?: string | null
          bride_email?: string | null
          bride_name?: string | null
          bride_phone?: string | null
          captcha_score?: number | null
          catering_notes?: string | null
          ceremony_time?: string | null
          coordinator_name?: string | null
          created_at?: string
          dj_name?: string | null
          event_date?: string | null
          groom_email?: string | null
          groom_name?: string | null
          groom_phone?: string | null
          guest_count?: number | null
          id?: string
          linens?: Json | null
          metadata?: Json
          music_notes?: string | null
          reception_time?: string | null
          signature_client?: string | null
          signature_coordinator?: string | null
          signed_at?: string | null
          submission_ip?: string | null
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      wedding_id_sequences: {
        Row: {
          created_at: string
          id: string
          month: number
          sequence_number: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          sequence_number?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          sequence_number?: number
          year?: number
        }
        Relationships: []
      }
      wedding_invitations: {
        Row: {
          booking_type: string | null
          bride_email: string
          bride_first_name: string
          bride_last_name: string
          couple_name: string
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          expires_at: string
          groom_email: string | null
          groom_first_name: string | null
          groom_last_name: string | null
          hourly_rate: number | null
          hours_booked: number | null
          id: string
          invitation_code: string
          phone: string | null
          requires_contract: boolean | null
          requires_payment: boolean | null
          status: string
          total_price: number | null
          updated_at: string
          used_at: string | null
          used_by: string | null
          venue: string | null
          wedding_date: string
        }
        Insert: {
          booking_type?: string | null
          bride_email: string
          bride_first_name: string
          bride_last_name: string
          couple_name: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          expires_at?: string
          groom_email?: string | null
          groom_first_name?: string | null
          groom_last_name?: string | null
          hourly_rate?: number | null
          hours_booked?: number | null
          id?: string
          invitation_code?: string
          phone?: string | null
          requires_contract?: boolean | null
          requires_payment?: boolean | null
          status?: string
          total_price?: number | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          venue?: string | null
          wedding_date: string
        }
        Update: {
          booking_type?: string | null
          bride_email?: string
          bride_first_name?: string
          bride_last_name?: string
          couple_name?: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          expires_at?: string
          groom_email?: string | null
          groom_first_name?: string | null
          groom_last_name?: string | null
          hourly_rate?: number | null
          hours_booked?: number | null
          id?: string
          invitation_code?: string
          phone?: string | null
          requires_contract?: boolean | null
          requires_payment?: boolean | null
          status?: string
          total_price?: number | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          venue?: string | null
          wedding_date?: string
        }
        Relationships: []
      }
      wedding_upgrades: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["upgrade_status"]
          updated_at: string
          upgrade_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["upgrade_status"]
          updated_at?: string
          upgrade_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["upgrade_status"]
          updated_at?: string
          upgrade_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_upgrades_upgrade_id_fkey"
            columns: ["upgrade_id"]
            isOneToOne: false
            referencedRelation: "upgrades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_upgrades_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_users: {
        Row: {
          id: string
          invitation_status: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          wedding_id: string
        }
        Insert: {
          id?: string
          invitation_status?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          wedding_id: string
        }
        Update: {
          id?: string
          invitation_status?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_users_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          breakdown_time: string | null
          client_source: string | null
          coordinator_id: string | null
          couple_names: string
          created_at: string
          event_type: string | null
          id: string
          notes: string | null
          package_type: string | null
          setup_time: string | null
          updated_at: string
          venue: string | null
          wedding_date: string
        }
        Insert: {
          breakdown_time?: string | null
          client_source?: string | null
          coordinator_id?: string | null
          couple_names: string
          created_at?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          package_type?: string | null
          setup_time?: string | null
          updated_at?: string
          venue?: string | null
          wedding_date: string
        }
        Update: {
          breakdown_time?: string | null
          client_source?: string | null
          coordinator_id?: string | null
          couple_names?: string
          created_at?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          package_type?: string | null
          setup_time?: string | null
          updated_at?: string
          venue?: string | null
          wedding_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_notification_safe: {
        Row: {
          assigned_vendor_id: string | null
          balance_paid: boolean | null
          contract_signed: boolean | null
          contract_signed_at: string | null
          coordinator_name: string | null
          couple_name: string | null
          created_at: string | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          dj_meal_included: boolean | null
          dj_name: string | null
          event_date: string | null
          event_type: string | null
          file_uploaded: boolean | null
          guest_count: number | null
          hours_booked: number | null
          id: string | null
          notes: string | null
          package_type: string | null
          status: string | null
          updated_at: string | null
          venue: string | null
          wedding_id: string | null
        }
        Insert: {
          assigned_vendor_id?: string | null
          balance_paid?: boolean | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          dj_meal_included?: boolean | null
          dj_name?: string | null
          event_date?: string | null
          event_type?: string | null
          file_uploaded?: boolean | null
          guest_count?: number | null
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          wedding_id?: string | null
        }
        Update: {
          assigned_vendor_id?: string | null
          balance_paid?: boolean | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          dj_meal_included?: boolean | null
          dj_name?: string | null
          event_date?: string | null
          event_type?: string | null
          file_uploaded?: boolean | null
          guest_count?: number | null
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notification_history_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      public_approved_reviews: {
        Row: {
          created_at: string | null
          event_date: string | null
          event_name: string | null
          event_type: string | null
          google_review_clicked: boolean | null
          id: string | null
          rating: number | null
          review_text: string | null
          reviewer_name: string | null
          updated_at: string | null
          video_path: string | null
          wedding_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          google_review_clicked?: boolean | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          video_path?: string | null
          wedding_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          google_review_clicked?: boolean | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          video_path?: string | null
          wedding_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_connections_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          spotify_user_id: string | null
          updated_at: string | null
          user_id: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          spotify_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          spotify_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "event_notification_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_connections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "vendor_event_details_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_assignment_costs_safe: {
        Row: {
          admin_markup_percent: number | null
          assignment_id: string | null
          client_price: number | null
          created_at: string | null
          hours_booked: number | null
          id: string | null
          notes: string | null
          overtime_hours: number | null
          payment_status: string | null
          total_client_price: number | null
          total_vendor_cost: number | null
          updated_at: string | null
          vendor_rate: number | null
        }
        Insert: {
          admin_markup_percent?: never
          assignment_id?: string | null
          client_price?: never
          created_at?: string | null
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          payment_status?: string | null
          total_client_price?: never
          total_vendor_cost?: number | null
          updated_at?: string | null
          vendor_rate?: number | null
        }
        Update: {
          admin_markup_percent?: never
          assignment_id?: string | null
          client_price?: never
          created_at?: string | null
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          payment_status?: string | null
          total_client_price?: never
          total_vendor_cost?: number | null
          updated_at?: string | null
          vendor_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_costs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "event_dj_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_event_details: {
        Row: {
          booking_source: string | null
          bride_email: string | null
          client_name: string | null
          client_signature_date: string | null
          client_signature_name: string | null
          contact_email: string | null
          contact_instruction: string | null
          contact_phone: string | null
          contract_signed: boolean | null
          contract_signed_at: string | null
          contract_url: string | null
          coordinator_name: string | null
          couple_name: string | null
          created_at: string | null
          dj_name: string | null
          dress_code: string | null
          event_date: string | null
          event_start_time: string | null
          event_type: string | null
          groom_email: string | null
          guest_count: number | null
          honoree_name: string | null
          hours_booked: number | null
          id: string | null
          notes: string | null
          package_type: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          venue: string | null
          venue_address: string | null
        }
        Insert: {
          booking_source?: never
          bride_email?: never
          client_name?: never
          client_signature_date?: never
          client_signature_name?: never
          contact_email?: never
          contact_instruction?: never
          contact_phone?: never
          contract_signed?: never
          contract_signed_at?: string | null
          contract_url?: never
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          dj_name?: string | null
          dress_code?: string | null
          event_date?: string | null
          event_start_time?: never
          event_type?: string | null
          groom_email?: never
          guest_count?: number | null
          honoree_name?: never
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          primary_contact_email?: never
          primary_contact_name?: never
          primary_contact_phone?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: never
        }
        Update: {
          booking_source?: never
          bride_email?: never
          client_name?: never
          client_signature_date?: never
          client_signature_name?: never
          contact_email?: never
          contact_instruction?: never
          contact_phone?: never
          contract_signed?: never
          contract_signed_at?: string | null
          contract_url?: never
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          dj_name?: string | null
          dress_code?: string | null
          event_date?: string | null
          event_start_time?: never
          event_type?: string | null
          groom_email?: never
          guest_count?: number | null
          honoree_name?: never
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          primary_contact_email?: never
          primary_contact_name?: never
          primary_contact_phone?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: never
        }
        Relationships: []
      }
      vendor_event_details_secure: {
        Row: {
          booking_source: string | null
          bride_email: string | null
          client_name: string | null
          contact_email: string | null
          contact_instruction: string | null
          contact_phone: string | null
          coordinator_name: string | null
          couple_name: string | null
          created_at: string | null
          dj_name: string | null
          dress_code: string | null
          event_date: string | null
          event_start_time: string | null
          event_type: string | null
          groom_email: string | null
          guest_count: number | null
          honoree_name: string | null
          hours_booked: number | null
          id: string | null
          notes: string | null
          package_type: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          venue: string | null
          venue_address: string | null
        }
        Insert: {
          booking_source?: never
          bride_email?: never
          client_name?: never
          contact_email?: never
          contact_instruction?: never
          contact_phone?: never
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          dj_name?: string | null
          dress_code?: string | null
          event_date?: string | null
          event_start_time?: never
          event_type?: string | null
          groom_email?: never
          guest_count?: number | null
          honoree_name?: never
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          primary_contact_email?: never
          primary_contact_name?: never
          primary_contact_phone?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: never
        }
        Update: {
          booking_source?: never
          bride_email?: never
          client_name?: never
          contact_email?: never
          contact_instruction?: never
          contact_phone?: never
          coordinator_name?: string | null
          couple_name?: string | null
          created_at?: string | null
          dj_name?: string | null
          dress_code?: string | null
          event_date?: string | null
          event_start_time?: never
          event_type?: string | null
          groom_email?: never
          guest_count?: number | null
          honoree_name?: never
          hours_booked?: number | null
          id?: string | null
          notes?: string | null
          package_type?: string | null
          primary_contact_email?: never
          primary_contact_name?: never
          primary_contact_phone?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: never
        }
        Relationships: []
      }
      vendor_pages_public: {
        Row: {
          approved_at: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string | null
          custom_sections: Json | null
          gallery_photos: Json | null
          headline: string | null
          highlight_reviews: boolean | null
          highlight_services: boolean | null
          id: string | null
          profile_photo_url: string | null
          show_pricing: boolean | null
          slug: string | null
          status: string | null
          submitted_at: string | null
          theme_color: string | null
          updated_at: string | null
          vendor_company_name: string | null
          vendor_first_name: string | null
          vendor_id: string | null
          vendor_instagram: string | null
          vendor_last_name: string | null
          vendor_vendor_type: string | null
          vendor_website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vp_client_visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles_safe: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          company_name: string | null
          email: string | null
          events_completed: number | null
          first_name: string | null
          id: string | null
          instagram_handle: string | null
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          specialties: Json | null
          total_reviews: number | null
          vendor_type: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          email?: never
          events_completed?: number | null
          first_name?: string | null
          id?: string | null
          instagram_handle?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: never
          specialties?: Json | null
          total_reviews?: number | null
          vendor_type?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          email?: never
          events_completed?: number | null
          first_name?: string | null
          id?: string | null
          instagram_handle?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: never
          specialties?: Json | null
          total_reviews?: number | null
          vendor_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      vp_client_visible_profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_coordinator: boolean | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          vendor_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: never
          first_name?: string | null
          id?: string | null
          is_coordinator?: boolean | null
          last_name?: string | null
          phone?: never
          role?: Database["public"]["Enums"]["user_role"] | null
          vendor_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: never
          first_name?: string | null
          id?: string | null
          is_coordinator?: boolean | null
          last_name?: string | null
          phone?: never
          role?: Database["public"]["Enums"]["user_role"] | null
          vendor_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_vendor_milestones: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_test_data: { Args: { days_old?: number }; Returns: number }
      couple_code_prefix: { Args: { p_event_type: string }; Returns: string }
      create_event_notification: { Args: { p_data: Json }; Returns: string }
      create_form_submission: {
        Args: {
          p_contact_email: string
          p_contact_name: string
          p_form_data: Json
          p_form_template_id: string
          p_metadata: Json
          p_status?: string
          p_wedding_id: string
        }
        Returns: string
      }
      create_wedding_for_user: {
        Args: {
          p_couple_names: string
          p_venue?: string
          p_wedding_date: string
        }
        Returns: {
          couple_names: string
          created_at: string
          id: string
          venue: string
          wedding_date: string
        }[]
      }
      e3c_advance_review_reminders: {
        Args: never
        Returns: {
          advanced_count: number
          stopped_count: number
        }[]
      }
      e3c_dispatch_vendor_event_reminders: {
        Args: never
        Returns: {
          dispatched_count: number
          skipped_count: number
        }[]
      }
      e3c_enqueue_post_event_reviews: {
        Args: never
        Returns: {
          enqueued_count: number
        }[]
      }
      e3c_next_review_send_date: {
        Args: { p_event_date: string; p_just_sent_reminder: number }
        Returns: string
      }
      ensure_vendor_stats: { Args: { p_vendor_id: string }; Returns: string }
      generate_couple_code: { Args: never; Returns: string }
      generate_wedding_id: { Args: never; Returns: string }
      get_assigned_vendor_ids_for_email: {
        Args: { p_email: string }
        Returns: string[]
      }
      get_event_names_for_threads: {
        Args: { p_event_ids: string[] }
        Returns: {
          couple_name: string
          event_date: string
          event_type: string
          id: string
        }[]
      }
      get_linked_weddings: {
        Args: never
        Returns: {
          contact_email: string
          contact_phone: string
          coordinator_name: string
          couple_names: string
          dj_name: string
          guest_count: number
          notification_couple_name: string
          notification_created_at: string
          notification_date: string
          notification_id: string
          notification_status: string
          package_type: string
          venue: string
          wedding_date: string
          wedding_id: string
        }[]
      }
      get_own_profile_protected_fields: {
        Args: never
        Returns: {
          average_rating: number
          events_completed: number
          internal_notes: string
          is_active: boolean
          is_coordinator: boolean
          role: Database["public"]["Enums"]["user_role"]
          total_reviews: number
          vendor_rating: number
          vendor_status: string
        }[]
      }
      get_own_profile_role: {
        Args: { p_user_id: string }
        Returns: {
          is_coordinator: boolean
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_recent_notifications: {
        Args: { p_limit?: number }
        Returns: {
          additional_metadata: Json
          contact_email: string
          contact_phone: string
          coordinator_name: string
          couple_name: string
          created_at: string
          dj_name: string
          dress_code: string
          edit_count: number
          edited_at: string
          event_date: string
          event_type: string
          file_uploaded: boolean
          form_progress: number
          guest_count: number
          id: string
          ip_address: string
          is_test: boolean
          last_resent_at: string
          notes: string
          package_type: string
          pricing_type: string
          primary_contact_name: string
          printed_at: string
          resend_count: number
          secondary_contact_name: string
          status: string
          submitted_by: string
          updated_at: string
          user_agent: string
          venue: string
          webhook_response: string
          webhook_status_code: number
          webhook_url: string
        }[]
      }
      get_spotify_tokens: {
        Args: { p_connection_id: string }
        Returns: {
          access_token: string
          expires_at: string
          refresh_token: string
          spotify_user_id: string
        }[]
      }
      get_upcoming_event_readiness: {
        Args: { p_event_id?: string; p_from_date?: string; p_limit?: number }
        Returns: {
          assignment_id: string
          balance_due: number
          balance_paid: boolean
          balance_paid_at: string
          contact_email: string
          contact_phone: string
          contract_signed: boolean
          contract_signed_at: string
          coordinator_name: string
          couple_name: string
          days_until_event: number
          deposit_amount: number
          deposit_paid: boolean
          deposit_paid_at: string
          event_date: string
          event_id: string
          event_type: string
          first_dance: string
          fully_ready: boolean
          guest_count: number
          last_dance: string
          music_sheet_id: string
          music_sheet_submitted: boolean
          notes: string
          package_type: string
          stripe_payment_intent_id: string
          vendor_company: string
          vendor_confirmed: boolean
          vendor_confirmed_at: string
          vendor_files_uploaded: boolean
          vendor_first_name: string
          vendor_last_name: string
          vendor_status: string
          vendor_type: string
          vendor_user_id: string
          venue: string
        }[]
      }
      get_vendor_event_history: {
        Args: { p_vendor_id: string }
        Returns: {
          assignment_id: string
          assignment_status: string
          booking_source: string
          bride_email: string
          contact_email: string
          couple_name: string
          dress_code: string
          event_date: string
          event_id: string
          event_type: string
          groom_email: string
          guest_count: number
          hours_booked: number
          last_resent_at: string
          notes: string
          package_type: string
          resend_count: number
          status: string
          venue: string
        }[]
      }
      get_venue_address: { Args: { venue_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_test_submissions: { Args: never; Returns: undefined }
      store_spotify_tokens: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_refresh_token: string
          p_spotify_user_id: string
          p_user_id: string
          p_wedding_id: string
        }
        Returns: string
      }
      update_spotify_tokens: {
        Args: {
          p_access_token: string
          p_connection_id: string
          p_expires_at: string
          p_refresh_token: string
        }
        Returns: undefined
      }
      va_get_public_vendor_page: { Args: { p_slug: string }; Returns: Json }
      va_lookup_invite_token: {
        Args: { p_token: string }
        Returns: {
          booking_request_id: string
          client_name: string
          event_date: string
          event_type: string
          token: string
          vendor_id: string
          vendor_type: string
        }[]
      }
      va_vendor_create_booking:
        | {
            Args: {
              p_bride_email?: string
              p_bride_name?: string
              p_bride_phone?: string
              p_client_phone?: string
              p_contact_email: string
              p_couple_name: string
              p_event_date?: string
              p_event_type?: string
              p_groom_email?: string
              p_groom_name?: string
              p_groom_phone?: string
              p_guest_count?: number
              p_honoree_name?: string
              p_notes?: string
              p_primary_contact_email?: string
              p_primary_contact_name?: string
              p_primary_contact_phone?: string
              p_venue?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_bride_email?: string
              p_bride_name?: string
              p_bride_phone?: string
              p_client_phone?: string
              p_contact_email: string
              p_couple_name: string
              p_event_date?: string
              p_event_type?: string
              p_groom_email?: string
              p_groom_name?: string
              p_groom_phone?: string
              p_guest_count?: number
              p_honoree_name?: string
              p_notes?: string
              p_primary_contact_email?: string
              p_primary_contact_name?: string
              p_primary_contact_phone?: string
              p_start_time?: string
              p_venue?: string
            }
            Returns: string
          }
      validate_dj_code: {
        Args: { code_to_check: string }
        Returns: {
          invited_company: string
          invited_email: string
          invited_first_name: string
          invited_last_name: string
          invited_role: string
          is_valid: boolean
          vendor_type: string
        }[]
      }
      vp_couple_update_event_safe: {
        Args: {
          p_customer_notes?: string
          p_event_id: string
          p_music_preferences?: Json
        }
        Returns: undefined
      }
      vp_ensure_legacy_wedding: {
        Args: { _event_id: string }
        Returns: undefined
      }
      vp_extract_song_from_events: {
        Args: { _events: Json; _label_patterns: string[] }
        Returns: string
      }
      vp_is_assigned_vendor: { Args: { _event_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      booking_source_type: "venue_partner" | "independent" | "referral"
      notification_type:
        | "message"
        | "update"
        | "reminder"
        | "task"
        | "vendor"
        | "upgrade_order"
        | "music_sheet_created"
        | "music_sheet_updated"
        | "new_assignment"
        | "vendor_confirmed"
        | "vendor_declined"
        | "vendor_completed"
        | "vendor_files_uploaded"
        | "assignment_cancelled"
        | "file_uploaded"
        | "contract_signed"
        | "meeting_scheduled"
        | "vendor_assignment"
        | "payment_received"
        | "review_submitted"
        | "contact_inquiry"
        | "client_message"
        | "meeting_booked"
        | "meeting_cancelled"
        | "vibe_sheet_updated"
      payment_status: "unpaid" | "partial" | "paid"
      upgrade_status: "selected" | "pending" | "confirmed" | "declined"
      user_role: "client" | "coordinator" | "dj" | "vendor"
      vendor_type:
        | "floral"
        | "catering"
        | "photography"
        | "venue"
        | "videography"
        | "cake"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "super_admin"],
      booking_source_type: ["venue_partner", "independent", "referral"],
      notification_type: [
        "message",
        "update",
        "reminder",
        "task",
        "vendor",
        "upgrade_order",
        "music_sheet_created",
        "music_sheet_updated",
        "new_assignment",
        "vendor_confirmed",
        "vendor_declined",
        "vendor_completed",
        "vendor_files_uploaded",
        "assignment_cancelled",
        "file_uploaded",
        "contract_signed",
        "meeting_scheduled",
        "vendor_assignment",
        "payment_received",
        "review_submitted",
        "contact_inquiry",
        "client_message",
        "meeting_booked",
        "meeting_cancelled",
        "vibe_sheet_updated",
      ],
      payment_status: ["unpaid", "partial", "paid"],
      upgrade_status: ["selected", "pending", "confirmed", "declined"],
      user_role: ["client", "coordinator", "dj", "vendor"],
      vendor_type: [
        "floral",
        "catering",
        "photography",
        "venue",
        "videography",
        "cake",
        "other",
      ],
    },
  },
} as const
