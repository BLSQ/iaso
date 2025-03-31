import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Grid, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { Selection } from '../../../orgUnits/types/selection';
import { userHasPermission } from '../../../users/utils';
import { useGetCheckBulkGpsPush } from '../../hooks/useGetCheckBulkGpsPush';
import { useInstanceBulkgpspush } from '../../hooks/useInstanceBulkgpspush';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import PushBulkGpsWarning from '../PushInstanceGps/PushBulkGpsWarning';
import PushGpsWarningMessage from '../PushInstanceGps/PushGpsWarningMessage';
import { LinkReferenceInstancesButton } from './LinkReferenceInstancesButton';

type Props = {
    selection: Selection<Instance>;
    isOpen: boolean;
    closeDialog: () => void;
};

const LinkReferenceInstancesComponent: FunctionComponent<Props> = ({
    selection,
    isOpen,
    closeDialog,
}) => {
    const select_all = selection.selectAll;
    const selected_ids = selection.selectedItems;
    const unselected_ids = selection.unSelectedItems;

    const onConfirm = useCallback(async () => {
        console.log('hello, teest');
        closeDialog();
    }, [closeDialog]);

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.pushGpsToOrgUnits}
            onConfirm={onConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.launch}
            open={isOpen}
            closeDialog={closeDialog}
            id="bulk-push-gps"
            onClose={() => null}
            dataTestId="bulk-push-gps"
        >
            <p>Hello bro</p>
        </ConfirmCancelModal>
    );
};

const LinkReferenceInstanceModal = makeFullModal(
    LinkReferenceInstancesComponent,
    LinkReferenceInstancesButton,
);

export { LinkReferenceInstanceModal as LinkReferenceInstancesModalComponent };
