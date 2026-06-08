import React, { FunctionComponent } from 'react';

import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { FormVersion } from '../../../forms/hooks/useGetPossibleFields';
import { PossibleField } from '../../../forms/types/forms';
import { useDeleteWorkflowChange } from '../../hooks/requests/useDeleteWorkflowChange';
import MESSAGES from '../../messages';
import { Change, ReferenceForm } from '../../types';

import { ChangesModal } from './Modal';

type Props = {
    change: Change;
    versionId: string;
    targetPossibleFields?: PossibleField[];
    targetPossibleFieldsByVersion?: FormVersion[];
    referenceForm?: ReferenceForm;
    changes?: Change[];
};

export const ChangesActionCell: FunctionComponent<Props> = ({
    change,
    versionId,
    targetPossibleFields,
    targetPossibleFieldsByVersion,
    referenceForm,
    changes,
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
                changes={changes || []}
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
