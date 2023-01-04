import React, { FunctionComponent } from 'react';

import { Change } from '../../types';

import MESSAGES from '../../messages';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { ChangesModal } from './Modal';

import { useDeleteWorkflowChange } from '../../hooks/requests/useDeleteWorkflowChange';
import { PossibleField } from '../../../forms/types/forms';

type Props = {
    change: Change;
    versionId: string;
    possibleFields: PossibleField[];
};

export const ChangesActionCell: FunctionComponent<Props> = ({
    change,
    versionId,
    possibleFields,
}) => {
    const { mutate: deleteWorkflowChange } = useDeleteWorkflowChange();
    return (
        <>
            <ChangesModal
                change={change}
                versionId={versionId}
                possibleFields={possibleFields}
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
