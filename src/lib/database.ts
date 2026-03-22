export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          email: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username?: string | null;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string;
          video_url: string;
          category_id: string;
          duration: number;
          views: number;
          likes: number;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_featured: boolean;
          video_type: "documentary" | "tutorial" | "news" | "interview";
          categories?: {
            id: string;
            name: string;
            description: string | null;
            icon: string;
            color: string;
            created_at: string;
          } | null;
          users?: {
            id: string;
            email: string;
            full_name: string;
            avatar_url: string | null;
          } | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          thumbnail_url: string;
          video_url: string;
          category_id: string;
          duration: number;
          views?: number;
          likes?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          is_featured?: boolean;
          video_type: "documentary" | "tutorial" | "news" | "interview";
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          thumbnail_url?: string;
          video_url?: string;
          category_id?: string;
          duration?: number;
          views?: number;
          likes?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          is_featured?: boolean;
          video_type?: "documentary" | "tutorial" | "news" | "interview";
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          content: string;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          content: string;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          content?: string;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      newsletter: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics: {
        Row: {
          id: string;
          video_id: string;
          views: number;
          completion_rate: number;
          avg_watch_time: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          views?: number;
          completion_rate?: number;
          avg_watch_time?: number;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          views?: number;
          completion_rate?: number;
          avg_watch_time?: number;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      wallet_accounts: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          locked_balance: number;
          currency: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          locked_balance?: number;
          currency?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          locked_balance?: number;
          currency?: string;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          counterparty_user_id: string | null;
          type: "internal_transfer" | "withdrawal" | "deposit" | "fee" | "adjustment";
          direction: "credit" | "debit";
          amount: number;
          fee: number;
          status: "pending" | "success" | "failed";
          network: string | null;
          tx_hash: string | null;
          to_address: string | null;
          from_address: string | null;
          deposit_address: string | null;
          reference_id: string | null;
          retry_count: number;
          error_message: string | null;
          description: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          counterparty_user_id?: string | null;
          type: "internal_transfer" | "withdrawal" | "deposit" | "fee" | "adjustment";
          direction: "credit" | "debit";
          amount: number;
          fee?: number;
          status?: "pending" | "success" | "failed";
          network?: string | null;
          tx_hash?: string | null;
          to_address?: string | null;
          from_address?: string | null;
          deposit_address?: string | null;
          reference_id?: string | null;
          retry_count?: number;
          error_message?: string | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          counterparty_user_id?: string | null;
          type?: "internal_transfer" | "withdrawal" | "deposit" | "fee" | "adjustment";
          direction?: "credit" | "debit";
          amount?: number;
          fee?: number;
          status?: "pending" | "success" | "failed";
          network?: string | null;
          tx_hash?: string | null;
          to_address?: string | null;
          from_address?: string | null;
          deposit_address?: string | null;
          reference_id?: string | null;
          retry_count?: number;
          error_message?: string | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          fee: number;
          to_address: string;
          network: string;
          status: "pending" | "processing" | "success" | "failed";
          tx_hash: string | null;
          wallet_transaction_id: string | null;
          attempts: number;
          next_retry_at: string | null;
          last_error: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          fee?: number;
          to_address: string;
          network?: string;
          status?: "pending" | "processing" | "success" | "failed";
          tx_hash?: string | null;
          wallet_transaction_id?: string | null;
          attempts?: number;
          next_retry_at?: string | null;
          last_error?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          fee?: number;
          to_address?: string;
          network?: string;
          status?: "pending" | "processing" | "success" | "failed";
          tx_hash?: string | null;
          wallet_transaction_id?: string | null;
          attempts?: number;
          next_retry_at?: string | null;
          last_error?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_limits: {
        Row: {
          user_id: string;
          daily_withdrawal_limit: number;
          single_withdrawal_limit: number;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          daily_withdrawal_limit?: number;
          single_withdrawal_limit?: number;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          daily_withdrawal_limit?: number;
          single_withdrawal_limit?: number;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      wallet_deposit_addresses: {
        Row: {
          id: string;
          user_id: string;
          network: string;
          address: string;
          memo: string | null;
          is_active: boolean;
          last_checked_block: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          network?: string;
          address: string;
          memo?: string | null;
          is_active?: boolean;
          last_checked_block?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          network?: string;
          address?: string;
          memo?: string | null;
          is_active?: boolean;
          last_checked_block?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          target_id: string | null;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          target_id?: string | null;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          target_id?: string | null;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      live_streams: {
        Row: {
          id: string;
          title: string;
          description: string;
          image: string;
          viewers: number;
          category: string;
          streamer: string;
          is_live: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          image?: string;
          viewers?: number;
          category?: string;
          streamer?: string;
          is_live?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image?: string;
          viewers?: number;
          category?: string;
          streamer?: string;
          is_live?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      podcasts: {
        Row: {
          id: string;
          title: string;
          description: string;
          image: string;
          duration: string;
          category: string;
          creator: string;
          views: number;
          likes: number;
          created_at: string;
          is_featured: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          image?: string;
          duration?: string;
          category?: string;
          creator?: string;
          views?: number;
          likes?: number;
          created_at?: string;
          is_featured?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image?: string;
          duration?: string;
          category?: string;
          creator?: string;
          views?: number;
          likes?: number;
          created_at?: string;
          is_featured?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      increment_views: {
        Args: {
          video_id: string;
        };
        Returns: void;
      };
      wallet_internal_transfer: {
        Args: {
          p_sender_id: string;
          p_recipient_id: string;
          p_amount: number;
          p_fee: number;
          p_description?: string | null;
          p_reference_id?: string | null;
        };
        Returns: string;
      };
      wallet_credit_deposit: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_tx_hash: string;
          p_network: string;
          p_deposit_address: string;
          p_confirmations: number;
          p_metadata?: Record<string, any> | null;
        };
        Returns: string;
      };
      wallet_create_withdrawal: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_fee: number;
          p_to_address: string;
          p_network: string;
          p_description?: string | null;
          p_reference_id?: string | null;
        };
        Returns: {
          withdrawal_id: string;
          transaction_id: string;
        };
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
