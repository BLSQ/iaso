import MESSAGES from './messages';
import { PromptnessStatus } from './types';

export const STATUS_ON_TIME: PromptnessStatus = 'ON_TIME';
export const STATUS_LATE: PromptnessStatus = 'LATE';
export const STATUS_MISSING: PromptnessStatus = 'MISSING';

export const PROMPTNESS_STATUSES: PromptnessStatus[] = [
    STATUS_ON_TIME,
    STATUS_LATE,
    STATUS_MISSING,
];

export const STATUS_MESSAGES = {
    [STATUS_ON_TIME]: MESSAGES.onTime,
    [STATUS_LATE]: MESSAGES.late,
    [STATUS_MISSING]: MESSAGES.missing,
};

export const STATUS_FIELDS: Record<
    PromptnessStatus,
    'on_time' | 'late' | 'missing'
> = {
    [STATUS_ON_TIME]: 'on_time',
    [STATUS_LATE]: 'late',
    [STATUS_MISSING]: 'missing',
};

export const STATUS_COLORS = {
    [STATUS_ON_TIME]: 'success.main',
    [STATUS_LATE]: 'warning.main',
    [STATUS_MISSING]: 'error.main',
};

export const DEFAULT_ORDERS: Record<PromptnessStatus, string> = {
    [STATUS_MISSING]: '-missing',
    [STATUS_LATE]: '-late',
    [STATUS_ON_TIME]: 'on_time',
};
export const DEFAULT_PAGE_SIZE = 20;

// The export_csv action of the API is not implemented yet (raises NotImplementedError)
export const CSV_EXPORT_ENABLED = false;

export const ORG_UNIT_FIELDS = 'id,name,parent,parent_id,org_unit_type_id';
