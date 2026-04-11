export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar_url?: string
  created_at?: string
}

export interface Contact {
  id: number
  name: string
  phone_number: string
  company?: string
  email?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface Agent {
  id: number
  name: string
  extension: number
  status: "online" | "busy" | "away"
  department?: string
  email?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface CallLog {
  id: number
  contact_id?: number
  agent_id?: number
  direction: "inbound" | "outbound"
  phone_number: string
  status: "answered" | "missed" | "declined" | "voicemail" | "transferred"
  duration: number
  notes?: string
  started_at: string
  ended_at?: string
  contact_name?: string
  agent_name?: string
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}
