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
      ad_campaigns: {
        Row: {
          ad_copy: Json
          campaign_name: string
          created_at: string
          creative_urls: string[]
          daily_budget_cents: number
          error_message: string | null
          id: string
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          objective: string
          performance: Json
          status: string
          target_audience: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_copy?: Json
          campaign_name: string
          created_at?: string
          creative_urls?: string[]
          daily_budget_cents?: number
          error_message?: string | null
          id?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          objective?: string
          performance?: Json
          status?: string
          target_audience?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_copy?: Json
          campaign_name?: string
          created_at?: string
          creative_urls?: string[]
          daily_budget_cents?: number
          error_message?: string | null
          id?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          objective?: string
          performance?: Json
          status?: string
          target_audience?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_program: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          referral_code: string
          status: string
          total_earned: number
          total_referrals: number
          user_id: string | null
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          referral_code: string
          status?: string
          total_earned?: number
          total_referrals?: number
          user_id?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          referral_code?: string
          status?: string
          total_earned?: number
          total_referrals?: number
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          payment_id: string | null
          referred_email: string
          referred_user_id: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_email: string
          referred_user_id?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_email?: string
          referred_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_leases: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string | null
          id: string
          leased_at: string
          next_run_at: string | null
          schedule: string | null
          status: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          leased_at?: string
          next_run_at?: string | null
          schedule?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          leased_at?: string
          next_run_at?: string | null
          schedule?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_leases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_id: string
          id: string
          input_payload: Json | null
          job_id: string | null
          lease_id: string
          result_summary: string | null
          status: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          input_payload?: Json | null
          job_id?: string | null
          lease_id: string
          result_summary?: string | null
          status?: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          input_payload?: Json | null
          job_id?: string | null
          lease_id?: string
          result_summary?: string | null
          status?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "agent_leases"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          category: string
          created_at: string
          description: string
          example_output: string | null
          headline: string
          icon_name: string
          id: string
          included_with_membership: boolean
          job_type: string
          name: string
          price_cents: number
          slug: string
          status: string
          stripe_price_id: string | null
          updated_at: string
          use_cases: string[]
          what_it_does: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          example_output?: string | null
          headline: string
          icon_name?: string
          id?: string
          included_with_membership?: boolean
          job_type: string
          name: string
          price_cents?: number
          slug: string
          status?: string
          stripe_price_id?: string | null
          updated_at?: string
          use_cases?: string[]
          what_it_does: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          example_output?: string | null
          headline?: string
          icon_name?: string
          id?: string
          included_with_membership?: boolean
          job_type?: string
          name?: string
          price_cents?: number
          slug?: string
          status?: string
          stripe_price_id?: string | null
          updated_at?: string
          use_cases?: string[]
          what_it_does?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          permissions: string[]
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          label?: string
          last_used_at?: string | null
          permissions?: string[]
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          permissions?: string[]
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          api_key_id: string
          created_at: string
          credits_consumed: number
          endpoint: string
          id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          credits_consumed?: number
          endpoint: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          credits_consumed?: number
          endpoint?: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          avoiding: string | null
          bottleneck: string
          consequence: string | null
          created_at: string
          disruptive_emotion: string | null
          email: string
          failed_projects: string | null
          failure_reason: string | null
          hours_per_week: string | null
          id: string
          momentum_loss: string | null
          monthly_revenue: string | null
          name: string
          payment_status: string | null
          peak_productivity: string | null
          phone_number: string | null
          product: string
          psychological_score: number | null
          role: string
          stage: string
          status: Database["public"]["Enums"]["application_status"]
          stripe_session_id: string | null
          team_status: string | null
          user_id: string | null
          why_now: string | null
          willing_reviews: boolean | null
          willing_structure: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          avoiding?: string | null
          bottleneck: string
          consequence?: string | null
          created_at?: string
          disruptive_emotion?: string | null
          email: string
          failed_projects?: string | null
          failure_reason?: string | null
          hours_per_week?: string | null
          id?: string
          momentum_loss?: string | null
          monthly_revenue?: string | null
          name: string
          payment_status?: string | null
          peak_productivity?: string | null
          phone_number?: string | null
          product: string
          psychological_score?: number | null
          role: string
          stage: string
          status?: Database["public"]["Enums"]["application_status"]
          stripe_session_id?: string | null
          team_status?: string | null
          user_id?: string | null
          why_now?: string | null
          willing_reviews?: boolean | null
          willing_structure?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          avoiding?: string | null
          bottleneck?: string
          consequence?: string | null
          created_at?: string
          disruptive_emotion?: string | null
          email?: string
          failed_projects?: string | null
          failure_reason?: string | null
          hours_per_week?: string | null
          id?: string
          momentum_loss?: string | null
          monthly_revenue?: string | null
          name?: string
          payment_status?: string | null
          peak_productivity?: string | null
          phone_number?: string | null
          product?: string
          psychological_score?: number | null
          role?: string
          stage?: string
          status?: Database["public"]["Enums"]["application_status"]
          stripe_session_id?: string | null
          team_status?: string | null
          user_id?: string | null
          why_now?: string | null
          willing_reviews?: boolean | null
          willing_structure?: boolean | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          description: string | null
          end_at: string
          id: string
          lead_id: string | null
          location: string | null
          start_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          lead_id?: string | null
          location?: string | null
          start_at: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          lead_id?: string | null
          location?: string | null
          start_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_locked: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      booking_settings: {
        Row: {
          available_days: number[]
          booking_slug: string
          created_at: string
          display_name: string
          end_hour: number
          id: string
          slot_duration_minutes: number
          start_hour: number
          timezone: string
          user_id: string
        }
        Insert: {
          available_days?: number[]
          booking_slug: string
          created_at?: string
          display_name?: string
          end_hour?: number
          id?: string
          slot_duration_minutes?: number
          start_hour?: number
          timezone?: string
          user_id: string
        }
        Update: {
          available_days?: number[]
          booking_slug?: string
          created_at?: string
          display_name?: string
          end_hour?: number
          id?: string
          slot_duration_minutes?: number
          start_hour?: number
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          duration_minutes: number
          guest_email: string
          guest_name: string
          guest_phone: string | null
          host_user_id: string
          id: string
          lead_id: string | null
          notes: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          host_user_id: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          host_user_id?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          appointment_id: string | null
          booking_made: boolean | null
          call_duration_seconds: number | null
          call_recording_url: string | null
          call_summary: string | null
          call_type: string
          context: Json | null
          country_code: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          lead_id: string | null
          phone_number: string
          quiz_answers: Json | null
          quiz_id: string | null
          quiz_result_label: string | null
          quiz_score: number | null
          status: string
          submission_id: string | null
          updated_at: string
          user_id: string
          vapi_call_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          booking_made?: boolean | null
          call_duration_seconds?: number | null
          call_recording_url?: string | null
          call_summary?: string | null
          call_type: string
          context?: Json | null
          country_code?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          phone_number: string
          quiz_answers?: Json | null
          quiz_id?: string | null
          quiz_result_label?: string | null
          quiz_score?: number | null
          status?: string
          submission_id?: string | null
          updated_at?: string
          user_id: string
          vapi_call_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          booking_made?: boolean | null
          call_duration_seconds?: number | null
          call_recording_url?: string | null
          call_summary?: string | null
          call_type?: string
          context?: Json | null
          country_code?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          phone_number?: string
          quiz_answers?: Json | null
          quiz_id?: string | null
          quiz_result_label?: string | null
          quiz_score?: number | null
          status?: string
          submission_id?: string | null
          updated_at?: string
          user_id?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          cohort_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          day_of_week: number
          id: string
          lead_id: string | null
          name: string
          time_slot: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          day_of_week: number
          id?: string
          lead_id?: string | null
          name: string
          time_slot: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          day_of_week?: number
          id?: string
          lead_id?: string | null
          name?: string
          time_slot?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchases: {
        Row: {
          credits_remaining: number
          credits_total: number
          expires_at: string | null
          id: string
          purchased_at: string
          resource_type: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          credits_remaining: number
          credits_total: number
          expires_at?: string | null
          id?: string
          purchased_at?: string
          resource_type: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          credits_remaining?: number
          credits_total?: number
          expires_at?: string | null
          id?: string
          purchased_at?: string
          resource_type?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dream_100: {
        Row: {
          ai_suggested: boolean
          created_at: string
          email: string | null
          followers_estimate: number | null
          id: string
          last_checked_at: string | null
          name: string
          niche: string | null
          notes: string | null
          outreach_status: string
          phone: string | null
          platform: string
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          ai_suggested?: boolean
          created_at?: string
          email?: string | null
          followers_estimate?: number | null
          id?: string
          last_checked_at?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          outreach_status?: string
          phone?: string | null
          platform?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          ai_suggested?: boolean
          created_at?: string
          email?: string | null
          followers_estimate?: number | null
          id?: string
          last_checked_at?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          outreach_status?: string
          phone?: string | null
          platform?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      funnel_leads: {
        Row: {
          answers: Json | null
          created_at: string
          email: string
          funnel_name: string | null
          funnel_owner_id: string | null
          id: string
          name: string
          phone: string | null
          score: number | null
          tier: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          email: string
          funnel_name?: string | null
          funnel_owner_id?: string | null
          id?: string
          name: string
          phone?: string | null
          score?: number | null
          tier?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          email?: string
          funnel_name?: string | null
          funnel_owner_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          score?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      funnel_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          downloads: number
          id: string
          niche: string
          preview_url: string | null
          price_cents: number
          quiz_config: Json
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          downloads?: number
          id?: string
          niche?: string
          preview_url?: string | null
          price_cents?: number
          quiz_config?: Json
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          downloads?: number
          id?: string
          niche?: string
          preview_url?: string | null
          price_cents?: number
          quiz_config?: Json
          title?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          created_at: string
          id: string
          input_snippet: string | null
          job_id: string
          output_snippet: string | null
          step: string
          success: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          input_snippet?: string | null
          job_id: string
          output_snippet?: string | null
          step: string
          success?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          input_snippet?: string | null
          job_id?: string
          output_snippet?: string | null
          step?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          id: string
          payload_json: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload_json?: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload_json?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activity_log: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          to_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          to_status: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          audit_summary: string | null
          business_name: string
          category: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          forum_post_url: string | null
          id: string
          notes: string | null
          phone: string | null
          pipeline_status: string
          rating: number | null
          sms_opt_out: boolean | null
          source: string
          suggested_reply: string | null
          updated_at: string
          user_id: string
          website: string | null
          website_quality_score: number | null
        }
        Insert: {
          address?: string | null
          audit_summary?: string | null
          business_name?: string
          category?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          forum_post_url?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          rating?: number | null
          sms_opt_out?: boolean | null
          source?: string
          suggested_reply?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          website_quality_score?: number | null
        }
        Update: {
          address?: string | null
          audit_summary?: string | null
          business_name?: string
          category?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          forum_post_url?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          rating?: number | null
          sms_opt_out?: boolean | null
          source?: string
          suggested_reply?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          website_quality_score?: number | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_config: {
        Row: {
          created_at: string
          cta_label: string
          display_name: string
          id: string
          outreach_templates: Json
          pipeline_stages: string[]
          quiz_prompt_context: string | null
          stat_labels: Json
        }
        Insert: {
          created_at?: string
          cta_label?: string
          display_name: string
          id: string
          outreach_templates?: Json
          pipeline_stages?: string[]
          quiz_prompt_context?: string | null
          stat_labels?: Json
        }
        Update: {
          created_at?: string
          cta_label?: string
          display_name?: string
          id?: string
          outreach_templates?: Json
          pipeline_stages?: string[]
          quiz_prompt_context?: string | null
          stat_labels?: Json
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      outreach_log: {
        Row: {
          channel: string
          click_count: number | null
          clicked_at: string | null
          company_name: string | null
          created_at: string
          delivery_status: string
          email_body: string | null
          email_subject: string | null
          grade: string | null
          id: string
          issues: string[] | null
          lead_id: string | null
          niche: string | null
          open_count: number | null
          opened_at: string | null
          phone_found: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sms_body: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          click_count?: number | null
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          delivery_status?: string
          email_body?: string | null
          email_subject?: string | null
          grade?: string | null
          id?: string
          issues?: string[] | null
          lead_id?: string | null
          niche?: string | null
          open_count?: number | null
          opened_at?: string | null
          phone_found?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sms_body?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          click_count?: number | null
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          delivery_status?: string
          email_body?: string | null
          email_subject?: string | null
          grade?: string | null
          id?: string
          issues?: string[] | null
          lead_id?: string | null
          niche?: string | null
          open_count?: number | null
          opened_at?: string | null
          phone_found?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sms_body?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          admin_notes: string | null
          audience_size: string | null
          business_name: string | null
          created_at: string
          email: string
          id: string
          name: string
          niche: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_url: string | null
          status: string
          why_partner: string | null
        }
        Insert: {
          admin_notes?: string | null
          audience_size?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          niche?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_url?: string | null
          status?: string
          why_partner?: string | null
        }
        Update: {
          admin_notes?: string | null
          audience_size?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          niche?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_url?: string | null
          status?: string
          why_partner?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          email: string
          id: string
          status: string
          stripe_session_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          email: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          board_id: string
          body: string
          created_at: string
          id: string
          pinned: boolean
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          board_id: string
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          board_id?: string
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliate_url: string | null
          attendance_count: number
          certified_at: string | null
          cohort_id: string | null
          consecutive_missed_sessions: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_multiplier: number
          invite_reputation_score: number
          last_attended_at: string | null
          member_status: Database["public"]["Enums"]["member_status"]
          member_tier: string | null
          niche: string | null
          target_location: string | null
        }
        Insert: {
          affiliate_url?: string | null
          attendance_count?: number
          certified_at?: string | null
          cohort_id?: string | null
          consecutive_missed_sessions?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          invite_multiplier?: number
          invite_reputation_score?: number
          last_attended_at?: string | null
          member_status?: Database["public"]["Enums"]["member_status"]
          member_tier?: string | null
          niche?: string | null
          target_location?: string | null
        }
        Update: {
          affiliate_url?: string | null
          attendance_count?: number
          certified_at?: string | null
          cohort_id?: string | null
          consecutive_missed_sessions?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_multiplier?: number
          invite_reputation_score?: number
          last_attended_at?: string | null
          member_status?: Database["public"]["Enums"]["member_status"]
          member_tier?: string | null
          niche?: string | null
          target_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_generations: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          tokens_estimate: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          tokens_estimate?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          tokens_estimate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_generations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "prompt_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      prompt_sessions: {
        Row: {
          context_json: Json
          created_at: string
          id: string
          last_output: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_json?: Json
          created_at?: string
          id?: string
          last_output?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_json?: Json
          created_at?: string
          id?: string
          last_output?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          integrations: string[] | null
          package_id: string | null
          packaged_complexity: string | null
          packaged_prompt: string | null
          packaged_summary: string | null
          packaged_tags: string[] | null
          problem: string | null
          raw_prompt: string
          scope: string | null
          status: string
          submitted_by: string
          target_user: string | null
          title: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          integrations?: string[] | null
          package_id?: string | null
          packaged_complexity?: string | null
          packaged_prompt?: string | null
          packaged_summary?: string | null
          packaged_tags?: string[] | null
          problem?: string | null
          raw_prompt: string
          scope?: string | null
          status?: string
          submitted_by: string
          target_user?: string | null
          title: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          integrations?: string[] | null
          package_id?: string | null
          packaged_complexity?: string | null
          packaged_prompt?: string | null
          packaged_summary?: string | null
          packaged_tags?: string[] | null
          problem?: string | null
          raw_prompt?: string
          scope?: string | null
          status?: string
          submitted_by?: string
          target_user?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_submissions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "prompt_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          changelog: string | null
          created_at: string
          id: string
          prompt_id: string
          prompt_text: string
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          id?: string
          prompt_id: string
          prompt_text: string
          version: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          id?: string
          prompt_id?: string
          prompt_text?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          approved_by: string | null
          complexity: string | null
          created_at: string
          created_by: string | null
          id: string
          package_id: string
          prompt_text: string
          status: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_by?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          package_id: string
          prompt_text: string
          status?: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_by?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          package_id?: string
          prompt_text?: string
          status?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "prompt_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          late_post_id: string | null
          media_urls: string[]
          platforms: string[]
          scheduled_for: string | null
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          late_post_id?: string | null
          media_urls?: string[]
          platforms?: string[]
          scheduled_for?: string | null
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          late_post_id?: string | null
          media_urls?: string[]
          platforms?: string[]
          scheduled_for?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      system_meta: {
        Row: {
          base_price: number
          founding_access_open: boolean
          id: string
          updated_at: string
          version: string
        }
        Insert: {
          base_price?: number
          founding_access_open?: boolean
          id?: string
          updated_at?: string
          version?: string
        }
        Update: {
          base_price?: number
          founding_access_open?: boolean
          id?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          campaigns_used: number
          created_at: string
          funnels_used: number
          id: string
          leads_used: number
          period_start: string
          sms_used: number
          updated_at: string
          user_id: string
          voice_calls_used: number
          workflows_used: number
        }
        Insert: {
          campaigns_used?: number
          created_at?: string
          funnels_used?: number
          id?: string
          leads_used?: number
          period_start?: string
          sms_used?: number
          updated_at?: string
          user_id: string
          voice_calls_used?: number
          workflows_used?: number
        }
        Update: {
          campaigns_used?: number
          created_at?: string
          funnels_used?: number
          id?: string
          leads_used?: number
          period_start?: string
          sms_used?: number
          updated_at?: string
          user_id?: string
          voice_calls_used?: number
          workflows_used?: number
        }
        Relationships: []
      }
      user_funnels: {
        Row: {
          affiliate_url: string | null
          brand_config: Json
          completion_action: string
          created_at: string
          id: string
          partner_mode: boolean
          quiz_config: Json
          slug: string
          status: string
          submissions_count: number
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_url?: string | null
          brand_config?: Json
          completion_action?: string
          created_at?: string
          id?: string
          partner_mode?: boolean
          quiz_config?: Json
          slug: string
          status?: string
          submissions_count?: number
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_url?: string | null
          brand_config?: Json
          completion_action?: string
          created_at?: string
          id?: string
          partner_mode?: boolean
          quiz_config?: Json
          slug?: string
          status?: string
          submissions_count?: number
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_funnels_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "funnel_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          id?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          agent_run_id: string | null
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          agent_run_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          agent_run_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          agent_toggles: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_toggles?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_toggles?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_memos: {
        Row: {
          call_log_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          phone_number: string
          script: string
          status: string
          twilio_call_sid: string | null
          user_id: string
        }
        Insert: {
          call_log_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          phone_number: string
          script: string
          status?: string
          twilio_call_sid?: string | null
          user_id: string
        }
        Update: {
          call_log_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          phone_number?: string
          script?: string
          status?: string
          twilio_call_sid?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_memos_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          output: Json | null
          position: number
          retry_count: number
          started_at: string | null
          status: string
          workflow_id: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          position: number
          retry_count?: number
          started_at?: string | null
          status?: string
          workflow_id: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          position?: number
          retry_count?: number
          started_at?: string | null
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          goal: string
          id: string
          memory: Json
          niche: string | null
          plan: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          memory?: Json
          niche?: string | null
          plan?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          memory?: Json
          niche?: string | null
          plan?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_usage: {
        Args: { p_user_id: string }
        Returns: {
          campaigns_used: number
          created_at: string
          funnels_used: number
          id: string
          leads_used: number
          period_start: string
          sms_used: number
          updated_at: string
          user_id: string
          voice_calls_used: number
          workflows_used: number
        }
        SetofOptions: {
          from: "*"
          to: "usage_tracking"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "chief_architect" | "architect_lead"
      application_status: "submitted" | "reviewing" | "accepted" | "rejected"
      member_status:
        | "pending"
        | "active"
        | "inactive"
        | "accepted_pending_payment"
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
      app_role: ["admin", "member", "chief_architect", "architect_lead"],
      application_status: ["submitted", "reviewing", "accepted", "rejected"],
      member_status: [
        "pending",
        "active",
        "inactive",
        "accepted_pending_payment",
      ],
    },
  },
} as const
