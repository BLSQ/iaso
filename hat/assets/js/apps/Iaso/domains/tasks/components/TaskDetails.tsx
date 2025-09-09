import { defineMessages } from 'react-intl';
import React, { FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { Button, Container } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
// @ts-ignore
import { Task } from 'Iaso/domains/tasks/types';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { SxStyles } from '../../../types/general';

const styles: SxStyles = {
    root: {
        cursor: 'default',
        paddingBottom: '2rem',
        paddingTop: '2rem',
    },
};

const MESSAGES = defineMessages({
    exportMobileAppDownloadBtn: {
        defaultMessage: 'Download file',
        id: 'iaso.users.exportMobileAppDownloadBtn',
    },
});

type Props = {
    task: Task;
};

const TaskDetails: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();

    const taskHasDownloadableFile =
        task.result &&
        task.result.data &&
        (typeof task.result.data === 'string' ||
            task.result.data instanceof String) &&
        task.result.data.startsWith('file:');

    const { data } = useQuery(
        ['taskDetails', task.id],
        () => getRequest(`/api/tasks/${task.id}/presigned-url/`),
        { enabled: Boolean(taskHasDownloadableFile) },
    );

    return (
        <Container maxWidth={false} sx={styles.root}>
            <pre style={{ textWrap: 'wrap' }}>{task.progress_message}</pre>
            {taskHasDownloadableFile && (
                <Button
                    variant="contained"
                    href={data?.presigned_url}
                    target="_blank"
                    disabled={!data || !data.presigned_url}
                >
                    {formatMessage(MESSAGES.exportMobileAppDownloadBtn)}
                </Button>
            )}
        </Container>
    );
};

export { TaskDetails };
