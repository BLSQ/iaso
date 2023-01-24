import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    QueryBuilderFields,
} from 'bluesquare-components';

import { FollowUps } from '../types/workflows';

import MESSAGES from '../messages';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { FollowUpsModal } from './FollowUpsModal';

import { useDeleteWorkflowFollowUp } from '../hooks/requests/useDeleteWorkflowFollowUp';

type Props = {
    followUp: FollowUps;
    fields: QueryBuilderFields;
    versionId: string;
};

export const FollowUpActionCell: FunctionComponent<Props> = ({
    followUp,
    fields,
    versionId,
}) => {
    const { mutate: deleteWorkflowVersion } = useDeleteWorkflowFollowUp();
    return (
        <>
            <FollowUpsModal
                followUp={followUp}
                fields={fields}
                versionId={versionId}
            />
            <DeleteDialog
                keyName={`delete-workflow-follow-up-${followUp.id}`}
                titleMessage={MESSAGES.deleteFollowUp}
                message={MESSAGES.deleteText}
                onConfirm={() => deleteWorkflowVersion(followUp.id)}
            />
        </>
    );
};
