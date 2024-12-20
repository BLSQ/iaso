import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Grid, Typography } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import { Selection } from '../../orgUnits/types/selection';
import { useGetCheckBulkGpsPush } from '../hooks/useGetCheckBulkGpsPush';
import PushBulkGpsWarning from './PushBulkGpsWarning';
import { useInstanceBulkgpspush } from '../hooks/useInstanceBulkgpspush';
import { baseUrls } from '../../../constants/urls';

type Props = {
    renderTrigger: (openDialog: boolean) => void;
    selection: Selection<Instance>;
};

const PushGpsDialogComponent: FunctionComponent<Props> = ({
    renderTrigger,
    selection,
}) => {
    const [approveOrgUnitHasGps, setApproveOrgUnitHasGps] =
        useState<boolean>(false);
    const [approveSubmissionNoHasGps, setApproveSubmissionNoHasGps] =
        useState<boolean>(false);
    const { mutateAsync: bulkgpspush } = useInstanceBulkgpspush();
    const select_all = selection.selectAll;
    const selected_ids = selection.selectedItems;
    const unselected_ids = selection.unSelectedItems;

    const { data: checkBulkGpsPush, isError } = useGetCheckBulkGpsPush({
        selected_ids: selected_ids.map(item => item.id).join(','),
        select_all,
        unselected_ids: unselected_ids.map(item => item.id).join(','),
    });

    const selected_ids_params = useMemo(() => {
        let instances = selected_ids;
        if (!approveOrgUnitHasGps) {
            instances = instances.filter(
                instance =>
                    !checkBulkGpsPush?.warning_overwrite?.includes(instance.id),
            );
        }
        if (!approveSubmissionNoHasGps) {
            instances = instances.filter(
                instance =>
                    !checkBulkGpsPush?.warning_no_location?.includes(
                        instance.id,
                    ),
            );
        }
        return instances;
    }, [
        approveOrgUnitHasGps,
        approveSubmissionNoHasGps,
        checkBulkGpsPush?.warning_no_location,
        checkBulkGpsPush?.warning_overwrite,
        selected_ids,
    ]);

    const unselected_ids_param = useMemo(() => {
        return unselected_ids;
    }, [unselected_ids]);

    const instancebulkgpspush = useCallback(async () => {
        await bulkgpspush({
            select_all,
            selected_ids: selected_ids_params.map(item => item.id),
            unselected_ids: unselected_ids_param.map(item => item.id),
        });
    }, [bulkgpspush, select_all, selected_ids_params, unselected_ids_param]);

    const onConfirm = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            closeDialog();
        },
        [instancebulkgpspush],
    );
    const redirectTo = useRedirectTo();
    const onConfirmAndSeeTask = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            closeDialog();
            redirectTo(baseUrls.tasks, {
                order: '-created_at',
            });
        },
        [instancebulkgpspush, redirectTo],
    );

    const onClosed = () => {
        return null;
    };

    const onApprove = type => {
        if (type === 'instanceNoGps') {
            if (approveSubmissionNoHasGps) {
                setApproveSubmissionNoHasGps(false);
            } else {
                setApproveSubmissionNoHasGps(true);
            }
        }

        if (type === 'orgUnitHasGps') {
            if (approveOrgUnitHasGps) {
                setApproveOrgUnitHasGps(false);
            } else {
                setApproveOrgUnitHasGps(true);
            }
        }
    };
    let title = MESSAGES.export;
    if (selection) {
        title = {
            ...MESSAGES.pushGpsToOrgUnits,
        };
    }
    const { formatMessage } = useSafeIntl();
    return (
        // @ts-ignore
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => renderTrigger(openDialog)}
            titleMessage={title}
            onConfirm={closeDialog => onConfirm(closeDialog)}
            confirmMessage={MESSAGES.launch}
            onClosed={onClosed}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={closeDialog =>
                onConfirmAndSeeTask(closeDialog)
            }
            allowConfimAdditionalButton
        >
            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12}>
                    <Typography variant="subtitle1">
                        {isError
                            ? formatMessage(
                                  MESSAGES.multipleInstancesOneOrgUnitWarningMessage,
                              )
                            : formatMessage(MESSAGES.pushGpsWarningMessage, {
                                  submissionCount: selection.selectCount,
                                  orgUnitCount: selection.selectCount,
                              })}
                    </Typography>
                </Grid>
                <PushBulkGpsWarning
                    condition={
                        (checkBulkGpsPush?.warning_no_location?.length ?? 0) >
                            0 && (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0
                    }
                    message={MESSAGES.noGpsForSomeInstaces}
                    approveCondition={approveSubmissionNoHasGps}
                    onApproveClick={() => onApprove('instanceNoGps')}
                />
                <PushBulkGpsWarning
                    condition={
                        (checkBulkGpsPush?.warning_overwrite?.length ?? 0) >
                            0 && (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0
                    }
                    message={MESSAGES.someOrgUnitsHasAlreadyGps}
                    approveCondition={approveOrgUnitHasGps}
                    onApproveClick={() => onApprove('orgUnitHasGps')}
                />
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
