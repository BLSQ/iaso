import React, { FunctionComponent, useCallback, useState } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    FilesUpload,
} from 'bluesquare-components';

import { Box, Typography } from '@mui/material';
import { AttachmentModalButton } from './AttachmentModalButton';

import MESSAGES from '../messages';

type Props = {
    isOpen: boolean;
    id?: string;
    dataTestId?: string;
    closeDialog: () => void;
    // eslint-disable-next-line no-unused-vars
    upload: (file: File[]) => void;
    isUploading: boolean;
};

const AttachmentModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    id,
    dataTestId,
    upload,
    isUploading,
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const { formatMessage } = useSafeIntl();
    const handleConfirm = useCallback(() => {
        upload(files);
    }, [files, upload]);
    return (
        <ConfirmCancelModal
            allowConfirm={files.length > 0 && !isUploading}
            titleMessage={formatMessage(MESSAGES.attachmentModalTitle)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId={dataTestId || ''}
            id={id || ''}
            onClose={() => null}
        >
            <FilesUpload
                files={files}
                onFilesSelect={newFiles => {
                    setFiles(newFiles);
                }}
                required
                multi={false}
                placeholder={formatMessage(MESSAGES.attachment)}
            />
            <Box mt={2}>
                <Typography variant="caption">
                    {formatMessage(MESSAGES.attachmentModalContent)}
                </Typography>
            </Box>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(AttachmentModal, AttachmentModalButton);

export { modalWithButton as AttachmentModal };
