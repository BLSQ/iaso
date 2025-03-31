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
import { useGetCheckBulkReferenceInstanceLink } from '../../hooks/useGetCheckBulkReferenceInstanceLink';
import { useInstanceBulkgpspush } from '../../hooks/useInstanceBulkgpspush';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import BulkLinkPushWarningMessage from '../PushInstanceGps/BulkLinkPushWarningMessage';
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
    const { formatMessage } = useSafeIntl();
    const select_all = selection.selectAll;
    const selected_ids = selection.selectedItems;
    const unselected_ids = selection.unSelectedItems;

    const {
        data: checkReferenceInstanceLink,
        isError,
        isLoading: isLoadingCheckResult,
    } = useGetCheckBulkReferenceInstanceLink({
        selected_ids: selected_ids.map(item => item.id).join(','),
        select_all,
        unselected_ids: unselected_ids.map(item => item.id).join(','),
    });

    const onConfirm = useCallback(async () => {
        closeDialog();
    }, [closeDialog]);
    const noLoadingAndNoError = useMemo(
        () => !isLoadingCheckResult && !isError,
        [isError, isLoadingCheckResult],
    );

    const getWarningMessage = () => {
        if (isError) {
            return MESSAGES.multipleReferenceInstancesOneOrgUnitWarningMessage;
        }
        if (checkReferenceInstanceLink?.warning) {
            return MESSAGES.noReferenceSubmissionsWarningMessage;
        }
        return '';
    };
    return (
        <ConfirmCancelModal
            allowConfirm={noLoadingAndNoError}
            titleMessage={MESSAGES.linkUnlinkReferenceSubmissionsToOrgUnits}
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
            {isLoadingCheckResult ? (
                <LoadingSpinner absolute />
            ) : (
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="subtitle1">
                            <BulkLinkPushWarningMessage
                                message={formatMessage(getWarningMessage(), {
                                    selectedSubmissionsCount:
                                        checkReferenceInstanceLink?.warning
                                            .length,
                                })}
                                paddingLeft="15px"
                                paddingTop="20px"
                                marginRight="100px"
                            />
                        </Typography>
                    </Grid>

                    {/* <PushBulkGpsWarning
                        condition={displayWarningSubmissionsNoGps}
                        message={MESSAGES.noGpsForSomeInstaces}
                        approveCondition={approveSubmissionNoHasGps}
                        onApproveClick={() => onApprove(INSTANCE_HAS_NO_GPS)}
                    />
                    <PushBulkGpsWarning
                        condition={displayWarningOverWriteGps}
                        message={MESSAGES.someOrgUnitsHasAlreadyGps}
                        approveCondition={approveOrgUnitHasGps}
                        onApproveClick={() =>
                            onApprove(ORG_UNIT_HAS_ALREADY_GPS)
                        }
                    />
                    {!approved && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                <PushGpsWarningMessage
                                    message={formatMessage(
                                        MESSAGES.approveAllWarningsMessage,
                                    )}
                                />
                            </Typography>
                        </Grid>
                    )} */}
                </Grid>
            )}
        </ConfirmCancelModal>
    );
};

const LinkReferenceInstanceModal = makeFullModal(
    LinkReferenceInstancesComponent,
    LinkReferenceInstancesButton,
);

export { LinkReferenceInstanceModal as LinkReferenceInstancesModalComponent };
