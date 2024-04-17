/* eslint-disable camelcase */
import { Nullable } from '../../types/utils';

export type TaskStatus =
    | 'RUNNING'
    | 'QUEUED'
    | 'SUCCESS'
    | 'KILLED'
    | 'SKIPPED'
    | 'EXPORTED'
    | 'ERRORED';

type User = {
    first_name: string;
    last_name: string;
    username?: string;
};

export type Task<T> = {
    id: number;
    created_at: number; // date
    started_at: number; // date
    ended_at: Nullable<number>; // date
    progress_value: number;
    end_value: number;
    launcher: User;
    result: Nullable<T>;
    status: TaskStatus;
    should_be_killed: boolean;
    progress_message: Nullable<string>;
    polio_notification_import_id?: number;
};

export type TaskApiResponse<T> = {
    task: Task<T>;
};

export type PolioNotificationImport = {
    id: number;
    account: number;
    file: string;
    status: string;
    errors: [];
    created_by: number;
    created_at: string; // DateTime
    updated_at?: string; // DateTime
};
