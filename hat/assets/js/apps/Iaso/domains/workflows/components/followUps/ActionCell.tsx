import React, { FunctionComponent } from 'react';
import { QueryBuilderFields } from 'bluesquare-components';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { useDeleteWorkflowFollowUp } from '../../hooks/requests/useDeleteWorkflowFollowUp';
import MESSAGES from '../../messages';
import { FollowUps } from '../../types';
import { FollowUpsModal } from './Modal';

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
    const { mutate: deleteWorkflowFollowUp } = useDeleteWorkflowFollowUp();
    return (
        <>
            <FollowUpsModal
                followUp={followUp}
                fields={fields}
                versionId={versionId}
                iconProps={{}}
            />
            <DeleteDialog
                keyName={`delete-workflow-follow-up-${followUp.id}`}
                titleMessage={MESSAGES.deleteFollowUp}
                message={MESSAGES.deleteText}
                onConfirm={() => deleteWorkflowFollowUp(followUp.id)}
            />
        </>
    );
};
