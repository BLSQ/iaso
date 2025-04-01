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
    const [toLinkIds, setToLinkIds] = useState<number[] | undefined>([]);
    const [toUnLinkIds, setToUnLinkIds] = useState<number[] | undefined>([]);
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
    const onCheck = useCallback(
        type => {
            if (type === 'link') {
                setToLinkIds(prev =>
                    (prev?.length || 0) > 0
                        ? []
                        : checkReferenceInstanceLink?.not_linked || [],
                );
                return;
            }
            setToUnLinkIds(prev =>
                (prev?.length || 0) > 0
                    ? []
                    : checkReferenceInstanceLink?.linked || [],
            );
        },
        [
            checkReferenceInstanceLink?.linked,
            checkReferenceInstanceLink?.not_linked,
            setToLinkIds,
            setToUnLinkIds,
        ],
    );
    const allowConfirm = useMemo(
        () =>
            !isLoadingCheckResult &&
            !isError &&
            ((toLinkIds?.length || 0) > 0 || (toUnLinkIds?.length || 0) > 0),
        [isError, isLoadingCheckResult, toLinkIds?.length, toUnLinkIds?.length],
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
                                    ids={toLinkIds}
                                    idsCound={
                                        checkReferenceInstanceLink?.not_linked
                                            ?.length
                                    }
                                    onCheck={() => onCheck('link')}
                                />
                            )}

                            {(checkReferenceInstanceLink?.linked?.length || 0) >
                                0 && (
                                <LinkReferenceInstancesCheckBox
                                    ids={toUnLinkIds}
                                    idsCound={
                                        checkReferenceInstanceLink?.linked
                                            ?.length
                                    }
                                    onCheck={() => onCheck('unlink')}
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
