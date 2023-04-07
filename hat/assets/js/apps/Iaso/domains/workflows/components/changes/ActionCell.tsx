import React, { FunctionComponent } from 'react';

import { Change, ReferenceForm, WorkflowVersionDetail } from '../../types';

import MESSAGES from '../../messages';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { ChangesModal } from './Modal';

import { useDeleteWorkflowChange } from '../../hooks/requests/useDeleteWorkflowChange';
import { PossibleField } from '../../../forms/types/forms';
import { FormVersion } from '../../../forms/hooks/useGetPossibleFields';

type Props = {
    change: Change;
    versionId: string;
    targetPossibleFields?: PossibleField[];
    targetPossibleFieldsByVersion?: FormVersion[];
    referenceForm?: ReferenceForm;
    workflowVersion?: WorkflowVersionDetail;
};

export const ChangesActionCell: FunctionComponent<Props> = ({
    change,
    versionId,
    targetPossibleFields,
    targetPossibleFieldsByVersion,
    referenceForm,
    workflowVersion,
}) => {
    const { mutate: deleteWorkflowChange } = useDeleteWorkflowChange();
    return (
        <>
            <ChangesModal
                iconProps={{}}
                change={change}
                versionId={versionId}
                targetPossibleFields={targetPossibleFields}
                targetPossibleFieldsByVersion={targetPossibleFieldsByVersion}
                referenceForm={referenceForm}
                changes={workflowVersion?.changes || []}
            />
            <DeleteDialog
                keyName={`delete-workflow-change-${change.id}`}
                titleMessage={MESSAGES.deleteChange}
                message={MESSAGES.deleteText}
                onConfirm={() => deleteWorkflowChange(change.id)}
            />
        </>
    );
};
