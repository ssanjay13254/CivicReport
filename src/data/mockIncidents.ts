import { IncidentReport } from '../types';

export const INITIAL_INCIDENTS: IncidentReport[] = [];

export const MUNICIPAL_DEPARTMENTS = [
  'Unassigned',
  'Road Works Division 3',
  'Sanitation Squad B',
  'Electrical Division 1',
  'Water Works & Sewerage Board',
  'Traffic Engineering Cell',
  'Disaster Response & Forestry',
  'Public Health Unit'
];

export const CATEGORY_DETAILS: Record<
  string,
  { icon: string; defaultPriority: 'Low' | 'Medium' | 'High' | 'Urgent'; color: string }
> = {
  'Road Pothole': { icon: '🚧', defaultPriority: 'High', color: '#f97316' },
  'Garbage & Waste': { icon: '🗑️', defaultPriority: 'Medium', color: '#eab308' },
  'Streetlight Malfunction': { icon: '💡', defaultPriority: 'Medium', color: '#3b82f6' },
  'Water Leakage': { icon: '🚰', defaultPriority: 'Urgent', color: '#06b6d4' },
  'Traffic Signal': { icon: '🚦', defaultPriority: 'High', color: '#ef4444' },
  'Damaged Sidewalk': { icon: '🚶', defaultPriority: 'Low', color: '#a855f7' },
  'Fallen Tree / Hazard': { icon: '🌳', defaultPriority: 'Urgent', color: '#10b981' }
};
