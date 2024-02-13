/* eslint-disable camelcase */
import { defineMessages } from 'react-intl';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Button, Container } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { Task } from 'Iaso/domains/tasks/types';
import { getRequest } from 'Iaso/libs/Api';

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

    const [presignedUrl, setPresignedUrl] = useState(null);

    const taskHasDownloadableFile =
        task.result && task.result.data && task.result.data.startsWith('file:');

    useEffect(() => {
        if (taskHasDownloadableFile) {
            getRequest(`/api/tasks/${task.id}/presigned-url/`).then(resp =>
                setPresignedUrl(resp.presigned_url),
            );
        }
    }, []);

    return (
        <Container maxWidth={false} sx={styles.root}>
            <pre style={{ textWrap: 'wrap' }}>{task.progress_message}</pre>
            {taskHasDownloadableFile && (
                <Button
                    variant="contained"
                    href={presignedUrl}
                    target="_blank"
                    disabled={!presignedUrl}
                >
                    {formatMessage(MESSAGES.exportMobileAppDownloadBtn)}
                </Button>
            )}
        </Container>
    );
};

export { TaskDetails };
