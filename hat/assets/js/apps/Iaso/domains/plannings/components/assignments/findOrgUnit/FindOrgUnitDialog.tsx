import React, { FC, useCallback, useState } from 'react';
import { Stack } from '@mui/material';
import { ConfirmCancelModal } from 'bluesquare-components';
import MESSAGES from '../../../messages';
import { FindOrgUnitTree } from './FindOrgUnitTree';

type Props = {
    initialSelectedId?: number;
    onShow: (orgUnitId: number) => void;
    onClose: () => void;
};

export const FindOrgUnitDialog: FC<Props> = ({
    initialSelectedId,
    onShow,
    onClose,
}) => {
    const [selectedId, setSelectedId] = useState(initialSelectedId);
    const handleConfirm = useCallback(() => {
        if (selectedId) onShow(selectedId);
    }, [onShow, selectedId]);
    return (
        <ConfirmCancelModal
            open
            id="find-org-unit-dialog"
            dataTestId="find-org-unit-dialog"
            titleMessage={MESSAGES.findOrgUnit}
            confirmMessage={MESSAGES.show}
            cancelMessage={MESSAGES.cancel}
            allowConfirm={Boolean(selectedId)}
            onConfirm={handleConfirm}
            onCancel={onClose}
            onClose={onClose}
            closeDialog={onClose}
            maxWidth="sm"
        >
            <Stack gap={1.5}>
                <FindOrgUnitTree
                    initialSelectedId={initialSelectedId}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            </Stack>
        </ConfirmCancelModal>
    );
};
