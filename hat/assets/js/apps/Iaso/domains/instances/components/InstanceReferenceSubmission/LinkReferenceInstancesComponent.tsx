import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import LinkIcon from '@mui/icons-material/Link';
import { Grid, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { Selection } from '../../../orgUnits/types/selection';
import { userHasPermission } from '../../../users/utils';
import { useGetCheckBulkReferenceInstanceLink } from '../../hooks/useGetCheckBulkReferenceInstanceLink';
import { useReferenceInstanceBulkLink } from '../../hooks/useReferenceInstanceBulkLink';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import WarningMessage from '../../utils/WarningMessage';
import { LinkReferenceInstancesCheckBox } from './LinkReferenceInstancesCheckBox';

type Props = {
    selection: Selection<Instance>;
    isOpen: boolean;
    closeDialog: () => void;
    resetSelection: () => void;
};

const LinkReferenceInstancesComponent: FunctionComponent<Props> = ({
    selection,
    isOpen,
    closeDialog,
    resetSelection,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    const redirectTo = useRedirectTo();

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
    const { mutateAsync: bulkLinkReferenceInstances } =
        useReferenceInstanceBulkLink();

    const instanceReferencebulkLink = useCallback(async () => {
        await bulkLinkReferenceInstances({
            actions,
            select_all,
            selected_ids: selected_ids.map(item => item.id),
            unselected_ids: unselected_ids.map(item => item.id),
        });
        resetSelection();
    }, [
        actions,
        bulkLinkReferenceInstances,
        resetSelection,
        select_all,
        selected_ids,
        unselected_ids,
    ]);

    const onConfirm = useCallback(async () => {
        instanceReferencebulkLink();
        closeDialog();
    }, [closeDialog, instanceReferencebulkLink]);

    const onConfirmAndSeeTask = useCallback(async () => {
        instanceReferencebulkLink();
        closeDialog();
        redirectTo(baseUrls.tasks, {
            order: '-created_at',
        });
    }, [closeDialog, instanceReferencebulkLink, redirectTo]);

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

    const hasTaskPermission = userHasPermission(
        Permission.DATA_TASKS,
        currentUser,
    );

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
            allowConfirmAdditionalButton={hasTaskPermission && allowConfirm}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={onConfirmAndSeeTask}
        >
            {isLoadingCheckResult ? (
                <LoadingSpinner absolute />
            ) : (
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="subtitle1">
                            {(warningMessage || isError) && (
                                <WarningMessage
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
                                        MESSAGES.linkReferenceSubmissionsConfirmMessage,
                                        {
                                            unLinkedCount:
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
                                        MESSAGES.unLinkReferenceSubmissionsConfirmMessage,
                                        {
                                            linkedCount:
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
    // @ts-ignore
    ({ onClick, iconDisabled }) => (
        <LinkIcon
            color={iconDisabled ? 'disabled' : 'inherit'}
            {...{
                onClick: !iconDisabled ? onClick : () => null,
                disabled: iconDisabled,
            }}
        />
    ),
);

export { LinkReferenceInstanceModal as LinkReferenceInstancesModalComponent };
