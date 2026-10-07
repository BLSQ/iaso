import { Column } from 'bluesquare-components';
import {
    ColumnSelectDrawerResult,
    useColumnSelectDrawer,
} from '../../../components/tables/ColumnSelectDrawer/useColumnSelectDrawer';

export const DEFAULT_USERS_HISTORY_COLUMNS = [
    'user',
    'created_at',
    'past_location',
    'new_location',
    'fields_modified',
    'modified_by',
];

export const useUsersHistoryColumnSelectDrawer = (
    columns: Column[],
    params: Record<string, any> & { fields?: string },
    baseUrl: string,
): ColumnSelectDrawerResult =>
    useColumnSelectDrawer({
        columns,
        params,
        baseUrl,
        defaultColumns: DEFAULT_USERS_HISTORY_COLUMNS,
    });
