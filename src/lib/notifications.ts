import { VERTICAL_LABELS } from '@/lib/constants';
import { type Vertical } from '@/types/database';

function getPortalUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || '';
}

export function formatSessionMessage(opts: {
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string | null;
  isMandatory: boolean;
}): string {
  const dateStr = new Date(opts.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const lines = [
    `*New Groundwork Session* ${opts.isMandatory ? '(Mandatory)' : ''}`.trim(),
    '',
    `📌 *${opts.title}*`,
  ];
  if (opts.description) lines.push(opts.description);
  lines.push(
    '',
    `📅 ${dateStr}`,
    `🕐 ${opts.startTime.slice(0, 5)} – ${opts.endTime.slice(0, 5)}`,
  );
  if (opts.location) lines.push(`📍 ${opts.location}`);
  lines.push(
    '',
    `View details and mark attendance on the portal:`,
    getPortalUrl() || 'the SusCell Portal',
    '',
    `— Sustainability Cell, IIT Bombay`,
  );
  return lines.join('\n');
}

export function formatAssignmentMessage(opts: {
  title: string;
  description: string;
  vertical: Vertical;
  deadline: string; // ISO
}): string {
  const deadlineDate = new Date(opts.deadline);
  const deadlineStr = deadlineDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const deadlineTime = deadlineDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const lines = [
    `*New Assignment for ${VERTICAL_LABELS[opts.vertical]}*`,
    '',
    `📋 *${opts.title}*`,
    '',
    opts.description.length > 200 ? opts.description.slice(0, 200) + '...' : opts.description,
    '',
    `⏰ *Deadline:* ${deadlineStr}, ${deadlineTime}`,
    '',
    `Submit on the portal:`,
    getPortalUrl() || 'the SusCell Portal',
    '',
    `— Sustainability Cell, IIT Bombay`,
  ];
  return lines.join('\n');
}

export function formatInterviewMessage(opts: {
  candidateName: string;
  scheduledAt: string; // ISO
  duration: number;
  location?: string | null;
}): string {
  const dt = new Date(opts.scheduledAt);
  const dateStr = dt.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const lines = [
    `Hi ${opts.candidateName.split(' ')[0]},`,
    '',
    `Your interview for the Sustainability Cell manager selection is scheduled.`,
    '',
    `📅 ${dateStr}`,
    `🕐 ${timeStr} (${opts.duration} min)`,
  ];
  if (opts.location) lines.push(`📍 ${opts.location}`);
  lines.push(
    '',
    `Please be on time. View details on the portal:`,
    getPortalUrl() || 'the SusCell Portal',
    '',
    `— Sustainability Cell, IIT Bombay`,
  );
  return lines.join('\n');
}
