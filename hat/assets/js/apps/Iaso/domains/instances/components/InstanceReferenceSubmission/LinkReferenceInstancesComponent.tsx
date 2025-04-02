import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Grid, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Selection } from '../../../orgUnits/types/selection';
import { useGetCheckBulkReferenceInstanceLink } from '../../hooks/useGetCheckBulkReferenceInstanceLink';
import { useReferenceInstanceBulkLinkpush } from '../../hooks/useReferenceInstanceBulkLinkpush';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import BulkLinkPushWarningMessage from '../PushInstanceGps/BulkLinkPushWarningMessage';
import { LinkReferenceInstancesButton } from './LinkReferenceInstancesButton';
import { LinkReferenceInstancesCheckBox } from './LinkReferenceInstancesCheckBox';

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
    const [actions, setActions] = useState<string[]>([]);
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
    const { mutateAsync: bulkLinkReferenceInstancespush } =
        useReferenceInstanceBulkLinkpush();

    const onConfirm = useCallback(async () => {
        await bulkLinkReferenceInstancespush({
            actions,
            select_all,
            selected_ids: selected_ids.map(item => item.id),
            unselected_ids: unselected_ids.map(item => item.id),
        });
        closeDialog();
    }, [
        actions,
        bulkLinkReferenceInstancespush,
        closeDialog,
        select_all,
        selected_ids,
        unselected_ids,
    ]);

    const onCheck = useCallback(type => {
        setActions(prev => {
            if (prev?.includes(type)) {
                return prev.filter(action => action !== type);
            }
            return [...(prev || []), type];
        });
    }, []);
    const allowConfirm = useMemo(
        () => !isLoadingCheckResult && !isError && actions?.length > 0,
        [actions?.length, isError, isLoadingCheckResult],
    );

    const warningMessage = useMemo(() => {
        if (isError) {
            return MESSAGES.multipleReferenceInstancesOneOrgUnitWarningMessage;
        }
        if (checkReferenceInstanceLink?.warning) {
            return MESSAGES.noReferenceSubmissionsWarningMessage;
        }
        return '';
    }, [checkReferenceInstanceLink?.warning, isError]);

    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
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
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="subtitle1">
                            {(warningMessage || isError) && (
                                <BulkLinkPushWarningMessage
                                    message={formatMessage(warningMessage, {
                                        selectedSubmissionsCount:
                                            checkReferenceInstanceLink?.warning
                                                ?.length,
                                    })}
                                    paddingLeft="15px"
                                    paddingTop="20px"
                                    marginRight="100px"
                                />
                            )}
                        </Typography>
                    </Grid>
                    {!isError && (
                        <>
                            {(checkReferenceInstanceLink?.not_linked?.length ||
                                0) > 0 && (
                                <LinkReferenceInstancesCheckBox
                                    actions={actions}
                                    action="link"
                                    message={formatMessage(
                                        MESSAGES.unLinkReferenceSubmissionsConfirmMessage,
                                        {
                                            linkedCount:
                                                checkReferenceInstanceLink
                                                    ?.not_linked?.length,
                                        },
                                    )}
                                    onCheck={onCheck}
                                />
                            )}

                            {(checkReferenceInstanceLink?.linked?.length || 0) >
                                0 && (
                                <LinkReferenceInstancesCheckBox
                                    actions={actions}
                                    action="unlink"
                                    onCheck={onCheck}
                                    message={formatMessage(
                                        MESSAGES.linkReferenceSubmissionsConfirmMessage,
                                        {
                                            unLinkedCount:
                                                checkReferenceInstanceLink
                                                    ?.linked?.length,
                                        },
                                    )}
                                />
                            )}
                        </>
                    )}
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
