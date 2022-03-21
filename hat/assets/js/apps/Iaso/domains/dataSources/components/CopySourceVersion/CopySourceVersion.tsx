/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
} from 'react';
import { Grid, Box, Divider } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../messages';
import {
    useCopyDataSourceVersion,
    useDataSourceAsDropDown,
    useDataSourceVersions,
} from '../../requests';
import { redirectTo } from '../../../../routing/actions';
import { baseUrls } from '../../../../constants/urls';
import InputComponent from '../../../../components/forms/InputComponent';
import { WarningMessage } from './CopyVersionWarnings';

type Props = {
    dataSourceId: number;
    dataSourceVersionNumber: number;
    dataSourceName: string;
};

const renderTrigger = ({ openDialog }) => (
    <IconButtonComponent
        onClick={openDialog}
        overrideIcon={FileCopyIcon}
        tooltipMessage={MESSAGES.copyVersion}
    />
);

const destinationSourceKey = 'destinationSource';
const destinationVersionKey = 'destinationVersion';
const chooseVersionKey = 'chooseVersion';
const forceOverwriteKey = 'forceOverwrite';

const change = setter => (_keyValue, value) => {
    setter(value);
};

const makeVersionsDropDown = (sourceVersions, dataSourceId, formatMessage) => {
    const existingVersions = sourceVersions
        .filter(sourceVersion => sourceVersion.data_source === dataSourceId)
        .map(sourceVersion => {
            return {
                label: sourceVersion.number.toString(),
                value: sourceVersion.number.toString(),
            };
        })
        .sort((a, b) => parseInt(a.number, 10) > parseInt(b.number, 10));
    // can't deduce the last version number from the index, since there can be a version 0
    const lastVersionIndex = existingVersions.length - 1;
    const nextVersionNumber =
        parseInt(existingVersions[lastVersionIndex].value, 10) + 1;
    return [
        ...existingVersions,
        {
            label: `${formatMessage(
                MESSAGES.nextVersion,
            )}: ${nextVersionNumber.toString()}`,
            value: nextVersionNumber.toString(),
        },
    ];
};

export const CopySourceVersion: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    const { formatMessage } = useSafeIntl();
    const [destinationSourceId, setDestinationSourceId] =
        useState(dataSourceId);

    const [chooseVersionNumber, setChooseVersionNumber] = useState(false);
    const [forceOverwrite, setForceOverwrite] = useState(false);
    const { mutateAsync: copyVersion } = useCopyDataSourceVersion();
    const dispatch = useDispatch();
    const { data: datasourcesDropdown } = useDataSourceAsDropDown();
    const { data: allSourceVersions } = useDataSourceVersions();
    const sourceVersionsDropDown = useMemo(
        () =>
            makeVersionsDropDown(
                allSourceVersions,
                dataSourceId,
                formatMessage,
            ),
        [allSourceVersions, dataSourceId, formatMessage],
    );
    const nextVersionNumber =
        sourceVersionsDropDown[sourceVersionsDropDown?.length - 1].value ?? 1;
    const [destinationVersionNumber, setDestinationVersionNumber] =
        useState(nextVersionNumber);

    const onConfirm = useCallback(
        closeDialog => {
            copyVersion({
                dataSourceId,
                dataSourceVersionNumber,
                destinationSourceId,
                destinationVersionNumber,
                forceOverwrite,
            });
            closeDialog();
        },
        [
            copyVersion,
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
            forceOverwrite,
        ],
    );

    const onRedirect = useCallback(
        async closeDialog => {
            await copyVersion({
                dataSourceId,
                dataSourceVersionNumber,
                destinationSourceId,
                destinationVersionNumber,
                forceOverwrite,
            });
            closeDialog();
            dispatch(
                redirectTo(baseUrls.tasks, {
                    order: '-created_at',
                }),
            );
        },
        [
            copyVersion,
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
            dispatch,
            forceOverwrite,
        ],
    );

    return (
        <ConfirmCancelDialogComponent
            id="copySourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.copy}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            allowConfirm
            titleMessage={{
                ...MESSAGES.copyVersionWithName,
                values: {
                    sourceName: dataSourceName,
                    versionNumber: dataSourceVersionNumber,
                },
            }}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            allowConfimAdditionalButton
            onAdditionalButtonClick={onRedirect}
            // Not defining these props makes TS unhappy (probably something with TS and PropTypes)
            onCancel={undefined}
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
                                labelString="destination source"
                                onChange={change(setDestinationSourceId)}
                                value={destinationSourceId}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <InputComponent
                                keyValue={chooseVersionKey}
                                type="checkbox"
                                labelString="choose version number"
                                onChange={change(setChooseVersionNumber)}
                                value={chooseVersionNumber}
                            />
                        </Grid>
                    </Grid>
                    {chooseVersionNumber && (
                        <Grid container item xs={6}>
                            <Grid item xs={12}>
                                {/* MarginBottom needed to align type number with type select, as number is not wrapped in a Box in library source code */}
                                <InputComponent
                                    keyValue={destinationVersionKey}
                                    type="select"
                                    labelString="destination version"
                                    onChange={change(
                                        setDestinationVersionNumber,
                                    )}
                                    options={sourceVersionsDropDown}
                                    value={destinationVersionNumber}
                                    disabled={!chooseVersionNumber}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <InputComponent
                                    keyValue={forceOverwriteKey}
                                    type="checkbox"
                                    labelString="force overwrite?"
                                    onChange={change(setForceOverwrite)}
                                    value={forceOverwrite}
                                    disabled={!chooseVersionNumber}
                                />
                            </Grid>
                        </Grid>
                    )}
                    <Grid container item xs={12}>
                        <WarningMessage
                            dataSourceName={dataSourceName}
                            dataSourceVersionNumber={dataSourceVersionNumber}
                            destinationSourceId={destinationSourceId}
                            destinationVersionNumber={destinationVersionNumber}
                            forceOverwrite={forceOverwrite}
                        />
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
