export interface User {
  id: string
  its_id: string
  password_hash: string
  created_at: string
  updated_at: string
  last_login: string | null
  active_session_token: string | null
}

export interface Setting {
  id: string
  youtube_url: string
  youtube_video_id: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  ip_address: string | null
  created_at: string
  last_seen: string
}

export interface DashboardStats {
  totalUsers: number
  onlineUsers: number
  activeSessions: number
  recentLogins: { its_id: string; last_login: string }[]
}
