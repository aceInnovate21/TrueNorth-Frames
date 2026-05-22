// Auto-generated types matching schema.dbml
// Run `supabase gen types typescript` to regenerate after schema changes

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'client' | 'photographer' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deactivated'
export type PhotographerProfileStatus = 'draft' | 'pending' | 'approved' | 'suspended' | 'banned'
export type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'cancellation_pending' | 'completed'
export type CancellationActor = 'client' | 'photographer' | 'admin'
export type BillingType = 'hourly' | 'package'
export type AvailabilityStatus = 'available' | 'tentative' | 'busy'
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked'
export type GroupInviteStatus = 'pending' | 'accepted' | 'declined'
export type CoverRequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export type ReviewFlagStatus = 'none' | 'flagged' | 'flag_resolved'
export type PlatformName = 'google' | 'yelp' | 'facebook' | 'instagram'
export type TrustSyncStatus = 'success' | 'partial' | 'failed'
export type SupportTicketStatus = 'open' | 'in_review' | 'resolved' | 'closed'
export type SupportTicketCategory = 'fake_review' | 'inappropriate_content' | 'spam_report' | 'billing_dispute' | 'account_issue' | 'other'
export type NotificationType =
  | 'booking_request' | 'booking_approved' | 'booking_declined' | 'booking_cancelled'
  | 'booking_completed' | 'new_message' | 'connection_request' | 'connection_accepted'
  | 'group_invite' | 'review_received' | 'review_reply' | 'trust_score_updated'
export type MessageSenderType = 'client' | 'photographer'
export type EmailQueueStatus = 'queued' | 'sent' | 'failed'
export type PlatformConfigType = 'integer' | 'numeric' | 'boolean' | 'text'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          full_name: string
          avatar_url: string | null
          account_status: AccountStatus
          status_reason: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          is_verified: boolean
          failed_login_count: number
          locked_until: string | null
          password_reset_count: number
          password_reset_window_start: string | null
          created_at: string
          updated_at: string
          last_active_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      client_profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          location: string | null
          preferred_style: string | null
          avatar_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['client_profiles']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['client_profiles']['Insert']>
      }
      photographer_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          display_name: string
          tagline: string | null
          bio: string | null
          location: string | null
          years_experience: number | null
          avatar_url: string | null
          cover_image_url: string | null
          instagram_url: string | null
          website_url: string | null
          rate_display: string | null
          rate_note: string | null
          trust_score: number
          native_avg_rating: number
          native_review_count: number
          last_trust_sync_at: string | null
          profile_view_count: number
          completeness_score: number
          profile_status: PhotographerProfileStatus
          submitted_for_review_at: string | null
          approved_at: string | null
          approved_by: string | null
          status_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['photographer_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['photographer_profiles']['Insert']>
      }
      photographer_specialties: {
        Row: { id: string; photographer_id: string; specialty: string }
        Insert: Omit<Database['public']['Tables']['photographer_specialties']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['photographer_specialties']['Insert']>
      }
      portfolio_albums: {
        Row: {
          id: string
          photographer_id: string
          title: string
          description: string | null
          cover_photo_id: string | null
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['portfolio_albums']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['portfolio_albums']['Insert']>
      }
      portfolio_photos: {
        Row: {
          id: string
          album_id: string
          photographer_id: string
          storage_asset_id: string
          caption: string | null
          alt_text: string | null
          sort_order: number
          width_px: number | null
          height_px: number | null
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['portfolio_photos']['Row'], 'id' | 'uploaded_at'> & { id?: string; uploaded_at?: string }
        Update: Partial<Database['public']['Tables']['portfolio_photos']['Insert']>
      }
      portfolio_videos: {
        Row: {
          id: string
          album_id: string
          photographer_id: string
          storage_asset_id: string
          thumbnail_asset_id: string | null
          title: string | null
          caption: string | null
          duration_seconds: number | null
          sort_order: number
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['portfolio_videos']['Row'], 'id' | 'uploaded_at'> & { id?: string; uploaded_at?: string }
        Update: Partial<Database['public']['Tables']['portfolio_videos']['Insert']>
      }
      photographer_faqs: {
        Row: {
          id: string
          photographer_id: string
          question: string
          answer: string
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['photographer_faqs']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['photographer_faqs']['Insert']>
      }
      packages: {
        Row: {
          id: string
          photographer_id: string
          name: string
          description: string | null
          billing_type: BillingType
          price: number
          duration_minutes: number | null
          deliverables: string[] | null
          is_active: boolean
          is_popular: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['packages']['Insert']>
      }
      availability_day_status: {
        Row: {
          id: string
          photographer_id: string
          date: string
          status: AvailabilityStatus
          note: string | null
        }
        Insert: Omit<Database['public']['Tables']['availability_day_status']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['availability_day_status']['Insert']>
      }
      weekly_time_slots: {
        Row: {
          id: string
          photographer_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_label: string
          max_clients: number
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['weekly_time_slots']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['weekly_time_slots']['Insert']>
      }
      booking_requests: {
        Row: {
          id: string
          client_id: string
          photographer_id: string
          package_id: string | null
          time_slot_id: string | null
          occasion: string
          description: string | null
          billing_type: BillingType
          billing_detail: string | null
          requested_date: string
          time_slot: string
          location_note: string | null
          status: BookingStatus
          photographer_note: string | null
          cancellation_reason: string | null
          cancellation_note: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['booking_requests']['Insert']>
      }
      booking_cancellation_requests: {
        Row: {
          id: string
          booking_id: string
          requested_by: string
          actor: CancellationActor
          reason: string
          note: string | null
          photographer_response: string | null
          responded_at: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_cancellation_requests']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['booking_cancellation_requests']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          photographer_id: string
          rating: number
          body: string | null
          public_reply: string | null
          replied_at: string | null
          flag_status: ReviewFlagStatus
          flag_reason: string | null
          flag_submitted_at: string | null
          flag_resolved_at: string | null
          flag_resolved_by: string | null
          private_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          booking_id: string | null
          client_id: string
          photographer_id: string
          last_message_at: string | null
          is_frozen: boolean
          is_flagged: boolean
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          frozen_at: string | null
          frozen_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_type: MessageSenderType
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      photographer_connections: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: ConnectionStatus
          requested_at: string
          responded_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['photographer_connections']['Row'], 'id' | 'requested_at'> & { id?: string; requested_at?: string }
        Update: Partial<Database['public']['Tables']['photographer_connections']['Insert']>
      }
      connection_groups: {
        Row: {
          id: string
          owner_id: string
          name: string
          emoji: string | null
          description: string | null
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['connection_groups']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['connection_groups']['Insert']>
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          photographer_id: string
          joined_at: string
          is_owner: boolean
        }
        Insert: Omit<Database['public']['Tables']['group_members']['Row'], 'id' | 'joined_at'> & { id?: string; joined_at?: string }
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>
      }
      group_invites: {
        Row: {
          id: string
          group_id: string
          inviter_id: string
          invitee_id: string
          status: GroupInviteStatus
          invited_at: string
          responded_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['group_invites']['Row'], 'id' | 'invited_at'> & { id?: string; invited_at?: string }
        Update: Partial<Database['public']['Tables']['group_invites']['Insert']>
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['group_messages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['group_messages']['Insert']>
      }
      cover_requests: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          booking_id: string | null
          message: string | null
          status: CoverRequestStatus
          created_at: string
          responded_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['cover_requests']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['cover_requests']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string | null
          read_at: string | null
          expires_at: string | null
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      support_tickets: {
        Row: {
          id: string
          submitted_by: string
          review_id: string | null
          conversation_id: string | null
          reported_user_id: string | null
          spam_reason: string | null
          spam_report_count: number | null
          category: SupportTicketCategory
          subject: string
          description: string
          status: SupportTicketStatus
          assigned_to: string | null
          resolution_note: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['support_tickets']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>
      }
      platform_config: {
        Row: {
          id: string
          key: string
          value: string
          value_type: PlatformConfigType
          category: string
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['platform_config']['Row'], 'id' | 'updated_at'> & { id?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['platform_config']['Insert']>
      }
      storage_assets: {
        Row: {
          id: string
          owner_id: string
          bucket: string
          key: string
          content_type: string | null
          size_bytes: number | null
          entity_type: string | null
          entity_id: string | null
          orphan_expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['storage_assets']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['storage_assets']['Insert']>
      }
      external_platform_links: {
        Row: {
          id: string
          photographer_id: string
          platform: PlatformName
          profile_url: string
          platform_rating: number | null
          platform_review_count: number | null
          is_verified: boolean
          last_fetched_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['external_platform_links']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['external_platform_links']['Insert']>
      }
      trust_sync_log: {
        Row: {
          id: string
          photographer_id: string
          platform: PlatformName
          status: TrustSyncStatus
          fetched_rating: number | null
          fetched_count: number | null
          error_message: string | null
          synced_at: string
        }
        Insert: Omit<Database['public']['Tables']['trust_sync_log']['Row'], 'id' | 'synced_at'> & { id?: string; synced_at?: string }
        Update: Partial<Database['public']['Tables']['trust_sync_log']['Insert']>
      }
      saved_photographers: {
        Row: { id: string; client_id: string; photographer_id: string; saved_at: string }
        Insert: Omit<Database['public']['Tables']['saved_photographers']['Row'], 'id' | 'saved_at'> & { id?: string; saved_at?: string }
        Update: Partial<Database['public']['Tables']['saved_photographers']['Insert']>
      }
      photographer_profile_views: {
        Row: {
          id: string
          photographer_id: string
          viewer_id: string | null
          viewer_role: string | null
          viewer_fingerprint: string
          view_date: string
          referrer_type: string | null
          viewed_at: string
        }
        Insert: Omit<Database['public']['Tables']['photographer_profile_views']['Row'], 'id' | 'viewed_at'> & { id?: string; viewed_at?: string }
        Update: Partial<Database['public']['Tables']['photographer_profile_views']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      account_status: AccountStatus
      photographer_profile_status: PhotographerProfileStatus
      booking_status: BookingStatus
      cancellation_actor: CancellationActor
      billing_type: BillingType
      availability_status: AvailabilityStatus
      connection_status: ConnectionStatus
      group_invite_status: GroupInviteStatus
      cover_request_status: CoverRequestStatus
      review_flag_status: ReviewFlagStatus
      platform_name: PlatformName
      trust_sync_status: TrustSyncStatus
      support_ticket_status: SupportTicketStatus
      support_ticket_category: SupportTicketCategory
      notification_type: NotificationType
      message_sender_type: MessageSenderType
      email_queue_status: EmailQueueStatus
      platform_config_type: PlatformConfigType
    }
  }
}
