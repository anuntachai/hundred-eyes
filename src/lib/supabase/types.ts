export interface Profile {
  id: string;
  display_name: string;
  house_number: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  is_flooded: boolean;
  message: string;
  photos: string[];
  created_at: string;
  flood_notified_at: string | null;
}

export interface FeedItem extends Report {
  reporter_name: string;
}
