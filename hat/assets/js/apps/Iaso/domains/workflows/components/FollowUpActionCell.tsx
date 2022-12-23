import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    QueryBuilderFields,
} from 'bluesquare-components';

import { FollowUps, Status } from '../types/workflows';

import MESSAGES from '../messages';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { FollowUpsModal } from './FollowUpsModal';

import { useDeleteWorkflowFollowUp } from '../hooks/requests/useDeleteWorkflowFollowUp';

type Props = {
    followUp: FollowUps;
    status: Status;
    fields: QueryBuilderFields;
};

export const FollowUpActionCell: FunctionComponent<Props> = ({
    followUp,
    status,
    fields,
}) => {
    const { mutate: deleteWorkflowVersion } = useDeleteWorkflowFollowUp();
    return (
        <>
            {status === 'DRAFT' && (
                <>
                    <FollowUpsModal followUp={followUp} fields={fields} />
                    <DeleteDialog
                        keyName={`delete-workflow-follow-up-${followUp.id}`}
                        titleMessage={MESSAGES.deleteFollowUp}
                        message={MESSAGES.deleteText}
                        onConfirm={() => deleteWorkflowVersion(followUp.id)}
                    />
                </>
            )}
        </>
    );
};
