import { ValidationQueue } from './types';

export const INSTANCES_API_URL = '/api/validation-workflows/instance/';
export const INSTANCES_QUERYKEY = 'validation-workflow-instances';

// oldest waiting submissions first
export const DEFAULT_ORDER = 'pending_since';
export const DEFAULT_PAGE_SIZE = 20;

export const QUEUES: ValidationQueue[] = [
    'awaiting_my_action',
    'awaiting_others',
    'handled_by_me',
    'rejected',
];
