/* eslint-disable camelcase */
import { Nullable } from '../../types/utils';

type TaskStatus =
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
};

export type TaskApiResponse<T> = {
    task: Task<T>;
};
