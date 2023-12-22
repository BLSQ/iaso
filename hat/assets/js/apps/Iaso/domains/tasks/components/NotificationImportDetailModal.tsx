import React, { FunctionComponent } from 'react';

import {
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { AlertModal } from '../../../components/AlertModal/AlertModal';

import MESSAGES from '../messages';
import { NotificationImportDetailButton } from './NotificationImportDetailButton';
import { Task } from '../types';
import { useGetPolioNotificationImport } from '../hooks/api';

type Props = {
    task: Task<any>;
    isOpen: boolean;
    closeDialog: () => void;
};

const NotificationImportDetailModal: FunctionComponent<Props> = ({
    task,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

    const {
        data: notificationImport,
        isFetching: isFetchingNotificationImport,
    } = useGetPolioNotificationImport(task.polio_notification_import_id);

    return (
        <AlertModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={formatMessage(
                MESSAGES.polioNotificationImportDetails,
            )}
            id="polio-notifications-import-details-modal"
            maxWidth="md"
        >
            {isFetchingNotificationImport && <LoadingSpinner />}
            {!isFetchingNotificationImport && (
                <>
                    <p>{task.result.message}</p>
                    {notificationImport &&
                        notificationImport.errors.length > 0 && (
                            <>
                                <p>
                                    {formatMessage(
                                        MESSAGES.polioNotificationImportErrors,
                                        {
                                            count: notificationImport.errors
                                                .length,
                                        },
                                    )}
                                </p>
                                <pre style={{ maxHeight: '550px' }}>
                                    {JSON.stringify(
                                        notificationImport.errors,
                                        null,
                                        ' ',
                                    )}
                                </pre>
                            </>
                        )}
                </>
            )}
        </AlertModal>
    );
};

const modalWithIconButton = makeFullModal(
    NotificationImportDetailModal,
    NotificationImportDetailButton,
);

export { modalWithIconButton as NotificationImportDetailModal };
