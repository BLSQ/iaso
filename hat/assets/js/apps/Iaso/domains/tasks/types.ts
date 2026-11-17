import { UrlParams } from 'bluesquare-components';
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
    id?: number;
    first_name: string;
    last_name: string;
    username?: string;
};

export type Task<T> = {
    id: number;
    name: string;
    created_at: number; // date
    started_at: number; // date
    ended_at: Nullable<number>; // date
    progress_value: number;
    end_value: number;
    created_by?: Nullable<User>;
    launcher: User;
    result: Nullable<T>;
    status: TaskStatus;
    should_be_killed: boolean;
    progress_message: Nullable<string>;
    external?: boolean;
    heartbeat_at?: Nullable<number>; // date, last sign of life of the worker running the task
};

export type TaskResultFile = {
    file: string;
    expires_at?: string; // DateTime
};

// A file is reported either as "file:<name>", or as { file, expires_at } when it expires.
export type TaskResult = {
    result: string;
    data?: Nullable<string | TaskResultFile>;
    message?: string;
};

export type TaskLog = {
    message: string;
    created_at: number; // date
};

export type TaskLogApiResponse = {
    status: TaskStatus;
    logs: TaskLog[];
    end_value: number;
    progress_value: number;
};

export type TaskApiResponse<T> = {
    task: Task<T>;
};

export type TaskParams = UrlParams & {
    accountId: number;
    startDate?: string;
    endDate?: string;
    status?: TaskStatus;
    users?: string;
    taskType?: string;
};
