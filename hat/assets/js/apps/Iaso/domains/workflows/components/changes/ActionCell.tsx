import React, { FunctionComponent } from 'react';

import { Change, ReferenceForm } from '../../types';

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
