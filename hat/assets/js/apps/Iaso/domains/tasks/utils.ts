import { Nullable } from '../../types/utils';
import { Task, TaskStatus } from './types';

export const ACTIVE_STATUSES: TaskStatus[] = ['RUNNING', 'QUEUED'];

export const isTaskActive = (task: Pick<Task<unknown>, 'status'>): boolean =>
    ACTIVE_STATUSES.includes(task.status);

// unit-based duration ("38 s", "4 min 12 s", "2 h 5 min"),
// more precise than moment's humanize.
export const formatDuration = (seconds: number): string => {
    const total = Math.max(0, Math.round(seconds));
    if (total < 1) {
        return '< 1 s';
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const parts: [number, string][] = [
        [hours, 'h'],
        [minutes, 'min'],
        [secs, 's'],
    ];
    const first = parts.findIndex(([value]) => value > 0);
    return parts
        .slice(first, first + 2)
        .filter(([value]) => value > 0)
        .map(([value, unit]) => `${value} ${unit}`)
        .join(' ');
};

// Duration between two unix timestamps.
export const durationBetween = (
    from?: Nullable<number>,
    to?: Nullable<number>,
): number | undefined => (from && to ? to - from : undefined);

// Elapsed time as a clock offset ("+0:42", "+1:02:03").
export const formatOffset = (seconds: number): string => {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, '0');
    return hours > 0
        ? `+${hours}:${String(minutes).padStart(2, '0')}:${secs}`
        : `+${minutes}:${secs}`;
};
