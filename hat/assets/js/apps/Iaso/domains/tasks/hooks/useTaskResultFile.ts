import moment, { Moment } from 'moment';
import { useQuery } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { Task, TaskResult, TaskResultFile } from '../types';

type TaskResultFileInfo = {
    fileName?: string;
    expiresAt?: Moment;
    hasExpired: boolean;
    presignedUrl?: string;
};

const getResultFile = (
    data: TaskResult['data'],
): TaskResultFile | undefined => {
    if (typeof data === 'string') {
        return data.startsWith('file:')
            ? { file: data.slice('file:'.length) }
            : undefined;
    }
    // External tasks write their result through the API, so ignore malformed data like the backend does.
    return typeof data?.file === 'string' && data.file ? data : undefined;
};

// The file produced by a task, reported either as "file:<path>" or as { file, expires_at }.
export const useTaskResultFile = (
    task: Task<TaskResult>,
): TaskResultFileInfo => {
    const resultFile = getResultFile(task.result?.data);
    const filePath = resultFile?.file;
    const expiresAt = resultFile?.expires_at
        ? moment(resultFile.expires_at)
        : undefined;
    const hasExpired = Boolean(expiresAt?.isSameOrBefore(moment()));
    const { data } = useQuery(
        ['taskDetails', task.id],
        () => getRequest(`/api/tasks/${task.id}/presigned-url/`),
        { enabled: Boolean(filePath) && !hasExpired },
    );
    return {
        fileName: filePath?.split('/').pop(),
        expiresAt,
        hasExpired,
        presignedUrl: data?.presigned_url,
    };
};
