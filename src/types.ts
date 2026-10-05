export type IncidentCategory =
  | 'Road Pothole'
  | 'Garbage & Waste'
  | 'Streetlight Malfunction'
  | 'Water Leakage'
  | 'Traffic Signal'
  | 'Damaged Sidewalk'
  | 'Fallen Tree / Hazard';

export type IncidentStatus = 'Pending' | 'In Progress' | 'Resolved';

export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface IncidentReport {
  id: string;
  category: IncidentCategory;
  description: string;
  lat: number;
  lng: number;
  address?: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  date: string;
  time: string;
  assignedTo: string;
  photoUrl: string;
  reporterName?: string;
  reporterContact?: string;
  reporterId?: string;
  updates?: {
    timestamp: string;
    action: string;
    actor: string;
  }[];
}

export type UserRole = 'citizen' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  badgeOrPhone?: string;
  department?: string;
  ward?: string;
}
