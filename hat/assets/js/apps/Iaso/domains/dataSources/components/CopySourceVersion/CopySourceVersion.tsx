import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Box, Divider, Grid } from '@mui/material';
import { IconButton, useRedirectTo, useSafeIntl } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../messages';
import {
    useCopyDataSourceVersion,
    useDataSourceAsDropDown,
    useDataSourceVersions,
} from '../../requests';
import { WarningMessage } from './CopyVersionWarnings';
import { userHasPermission } from '../../../users/utils';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';

type Props = {
    dataSourceId: number;
    dataSourceVersionNumber: number;
    dataSourceName: string;
};

const renderTrigger = ({ openDialog }) => (
    <IconButton
        onClick={openDialog}
        overrideIcon={FileCopyIcon}
        tooltipMessage={MESSAGES.copyVersion}
        dataTestId="copyversion-button"
    />
);

const destinationSourceKey = 'destinationSource';

const change = setter => (_keyValue, value) => {
    setter(value);
};

const makeVersionsDropDown = (sourceVersions, dataSourceId, formatMessage) => {
    const existingVersions =
        sourceVersions
            ?.filter(
                sourceVersion => sourceVersion.data_source === dataSourceId,
            )
            .map(sourceVersion => {
                return {
                    label: sourceVersion.number.toString(),
                    value: sourceVersion.number.toString(),
                };
            })
            .sort((a, b) => parseInt(a.number, 10) > parseInt(b.number, 10)) ??
        [];
    // can't deduce the last version number from the index, since there can be a version 0
    const lastVersionIndex = existingVersions.length - 1;
    const nextVersionNumber =
        parseInt(existingVersions[lastVersionIndex]?.value ?? 0, 10) + 1;
    return [
        ...existingVersions,
        {
            label: `${formatMessage(
                MESSAGES.nextVersion,
            )}: ${nextVersionNumber}`,
            value: nextVersionNumber.toString(),
        },
    ];
};

export const CopySourceVersion: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const [destinationSourceId, setDestinationSourceId] =
        useState(dataSourceId);
    const { mutateAsync: copyVersion } = useCopyDataSourceVersion();
    const { data: datasourcesDropdown } = useDataSourceAsDropDown();
    const { data: allSourceVersions } = useDataSourceVersions();
    const allowConfirm = Boolean(destinationSourceId);
    const sourceVersionsDropDown = useMemo(
        () =>
            makeVersionsDropDown(
                allSourceVersions,
                destinationSourceId,
                formatMessage,
            ),
        [allSourceVersions, destinationSourceId, formatMessage],
    );
    const nextVersionNumber =
        // eslint-disable-next-line no-unsafe-optional-chaining
        sourceVersionsDropDown[sourceVersionsDropDown?.length - 1]?.value ?? 1;
    const [destinationVersionNumber, setDestinationVersionNumber] =
        useState(nextVersionNumber);
    const warningVersionNumber = destinationVersionNumber ?? nextVersionNumber;

    const reset = useCallback(() => {
        setDestinationSourceId(dataSourceId);
        setDestinationVersionNumber(nextVersionNumber);
    }, [dataSourceId, nextVersionNumber]);

    const copyAndReset = useCallback(async () => {
        await copyVersion({
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
        });
        reset();
    }, [
        copyVersion,
        dataSourceId,
        dataSourceVersionNumber,
        destinationSourceId,
        destinationVersionNumber,
        reset,
    ]);

    const onConfirm = useCallback(
        async closeDialog => {
            await copyAndReset();
            closeDialog();
        },
        [copyAndReset],
    );

    const onRedirect = useCallback(
        async closeDialog => {
            await copyAndReset();
            closeDialog();
            redirectTo(baseUrls.tasks, {
                order: '-created_at',
            });
        },
        [copyAndReset, redirectTo],
    );

    const onCancel = useCallback(
        async closeDialog => {
            reset();
            closeDialog();
        },
        [reset],
    );

    useEffect(() => {
        if (destinationVersionNumber !== nextVersionNumber)
            setDestinationVersionNumber(nextVersionNumber);
    }, [destinationVersionNumber, nextVersionNumber]);

    const hasTaskPermission = userHasPermission(
        Permission.DATA_TASKS,
        currentUser,
    );

    return (
        <ConfirmCancelDialogComponent
            id="copySourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.copy}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            titleMessage={{
                ...MESSAGES.copyVersionWithName,
                values: {
                    sourceName: dataSourceName,
                    versionNumber: dataSourceVersionNumber,
                },
            }}
            onCancel={onCancel}
            dataTestId="copy-source-version-modal"
            allowConfirm={allowConfirm}
            allowConfimAdditionalButton={allowConfirm && hasTaskPermission}
            additionalButton={hasTaskPermission}
            additionalMessage={
                hasTaskPermission ? MESSAGES.goToCurrentTask : undefined
            }
            onAdditionalButtonClick={hasTaskPermission ? onRedirect : undefined}
        >
            <>
                <Box mb={2}>
                    <Divider />
                </Box>
                <Grid
                    container
                    spacing={2}
                    direction="row"
                    justifyContent="space-around"
                >
                    <Grid container item xs={6}>
                        <Grid item xs={12}>
                            <InputComponent
                                keyValue={destinationSourceKey}
                                type="select"
                                options={datasourcesDropdown}
                                labelString={formatMessage(
                                    MESSAGES.destinationSource,
                                )}
                                onChange={change(setDestinationSourceId)}
                                value={destinationSourceId}
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12}>
                        <WarningMessage
                            dataSourceName={dataSourceName}
                            dataSourceVersionNumber={dataSourceVersionNumber}
                            destinationSourceId={destinationSourceId}
                            destinationVersionNumber={warningVersionNumber}
                        />
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
