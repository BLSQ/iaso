import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';

import { QueryBuilderFields } from 'bluesquare-components';

import { FollowUps } from '../../types';

import MESSAGES from '../../messages';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { FollowUpsModal } from './Modal';

import { useDeleteWorkflowFollowUp } from '../../hooks/requests/useDeleteWorkflowFollowUp';

type Props = {
    followUp: FollowUps;
    fields: QueryBuilderFields;
    versionId: string;
    setCurrentFields?: Dispatch<SetStateAction<QueryBuilderFields>>;
};

export const FollowUpActionCell: FunctionComponent<Props> = ({
    followUp,
    fields,
    versionId,
    setCurrentFields = () => null,
}) => {
    const { mutate: deleteWorkflowFollowUp } = useDeleteWorkflowFollowUp();
    return (
        <>
            <FollowUpsModal
                followUp={followUp}
                fields={fields}
                versionId={versionId}
                iconProps={{}}
                setCurrentFields={setCurrentFields}
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
