import React, { FunctionComponent, useCallback } from 'react';

import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { OrgUnitChangeRequest, ApproveOrgUnitParams } from '../types';
import { Selection } from '../../types/selection';
import { useBulkDeleteChangeRequests } from '../hooks/api/useBulkDeleteChangeRequest';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<OrgUnitChangeRequest>;
    resetSelection: () => void;
    params: ApproveOrgUnitParams;
};

export const BulkDeleteDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    selection,
    resetSelection,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { selectCount } = selection;

    const { mutate: bulkDeleteChangeRequests } =
        useBulkDeleteChangeRequests(params);

    const onDelete = useCallback(
        () => bulkDeleteChangeRequests({ ...selection }),
        [bulkDeleteChangeRequests, closeDialog, resetSelection, selection],
    );

    if (!isOpen) {
        return null;
    }
    return (
        <ConfirmCancelModal
            open={isOpen}
            onClose={closeDialog}
            id="BulkDeleteOrgUnitChangesDialog"
            dataTestId="BulkDeleteOrgUnitChangesDialog"
            titleMessage={formatMessage(
                MESSAGES.bulkDeleteOrgUnitChangesCount,
                {
                    count: selectCount,
                },
            )}
            closeDialog={closeDialog}
            onConfirm={onDelete}
            onCancel={() => null}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
            closeOnConfirm
        >
            <p>{formatMessage(MESSAGES.bulkDeleteAction)}</p>
        </ConfirmCancelModal>
    );
};
