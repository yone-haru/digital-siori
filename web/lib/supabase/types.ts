export type BookStatus = "reading" | "rereading" | "finished" | "to_read";

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string;
          cover_url: string | null;
          total_pages: number;
          current_page: number;
          status: BookStatus;
          isbn: string | null;
          description: string | null;
          started_at: string | null;
          finished_at: string | null;
          read_count: number;
          rating: number | null;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          author: string;
          cover_url?: string | null;
          total_pages: number;
          current_page?: number;
          status?: BookStatus;
          isbn?: string | null;
          description?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          read_count?: number;
          rating?: number | null;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string;
          cover_url?: string | null;
          total_pages?: number;
          current_page?: number;
          status?: BookStatus;
          isbn?: string | null;
          description?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          read_count?: number;
          rating?: number | null;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      session_memos: {
        Row: {
          id: string;
          session_id: string;
          book_id: string;
          user_id: string;
          page_number: number;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          book_id: string;
          user_id?: string;
          page_number: number;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          book_id?: string;
          user_id?: string;
          page_number?: number;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      book_tags: {
        Row: {
          book_id: string;
          tag_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          book_id: string;
          tag_id: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          book_id?: string;
          tag_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reading_sessions: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          started_at: string;
          ended_at: string;
          start_page: number;
          end_page: number;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id?: string;
          started_at: string;
          ended_at: string;
          start_page: number;
          end_page: number;
          duration_seconds: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string;
          start_page?: number;
          end_page?: number;
          duration_seconds?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
