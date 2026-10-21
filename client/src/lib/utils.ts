import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    UNDER_OFFER: 'bg-yellow-100 text-yellow-700',
    SOLD: 'bg-blue-100 text-blue-700',
    RENTED: 'bg-purple-100 text-purple-700',
    INACTIVE: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getLeadStageColor(stage: string): string {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    SITE_VISIT_SCHEDULED: 'bg-amber-100 text-amber-700',
    NEGOTIATION: 'bg-purple-100 text-purple-700',
    CLOSED: 'bg-green-100 text-green-700',
    DROPPED: 'bg-red-100 text-red-700',
  };
  return colors[stage] || 'bg-gray-100 text-gray-700';
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APARTMENT: 'Apartment', VILLA: 'Villa', INDEPENDENT_HOUSE: 'Independent House',
    PLOT: 'Plot', COMMERCIAL: 'Commercial',
  };
  return labels[type] || type;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
