/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
    useEffect,
} from 'react';
import { Grid, Box, Divider } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
    Select,
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
        parseInt(existingVersions[lastVersionIndex]?.value ?? 0, 10) + 1;
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

const WITH_ERROR = ['Error'];
const EMPTY_ERROR: string[] = [];

export const CopySourceVersion: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    const { formatMessage } = useSafeIntl();
    const [destinationSourceId, setDestinationSourceId] =
        useState(dataSourceId);
    const [sourceVersionErrors, setSourceVersionsErrors] = useState<string[]>(
        [],
    );
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
                destinationSourceId,
                formatMessage,
            ),
        [allSourceVersions, destinationSourceId, formatMessage],
    );
    const nextVersionNumber =
        sourceVersionsDropDown[sourceVersionsDropDown?.length - 1].value ?? 1;
    const [destinationVersionNumber, setDestinationVersionNumber] =
        useState(nextVersionNumber);
    const warningVersionNumber = destinationVersionNumber ?? nextVersionNumber;

    const preventConfirm =
        warningVersionNumber !== nextVersionNumber && !forceOverwrite;
    const errorMessage = preventConfirm
        ? formatMessage(MESSAGES.mustForceOverwrite)
        : '';

    const reset = useCallback(() => {
        setDestinationSourceId(dataSourceId);
        setDestinationVersionNumber(nextVersionNumber);
        setForceOverwrite(false);
        setChooseVersionNumber(false);
    }, [dataSourceId, nextVersionNumber]);

    const copyAndReset = useCallback(async () => {
        await copyVersion({
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
            forceOverwrite,
        });
        reset();
    }, [
        copyVersion,
        dataSourceId,
        dataSourceVersionNumber,
        destinationSourceId,
        destinationVersionNumber,
        forceOverwrite,
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
            dispatch(
                redirectTo(baseUrls.tasks, {
                    order: '-created_at',
                }),
            );
        },
        [copyAndReset, dispatch],
    );

    const onCancel = useCallback(
        async closeDialog => {
            reset();
            closeDialog();
        },
        [reset],
    );

    useEffect(() => {
        if (!chooseVersionNumber)
            setDestinationVersionNumber(nextVersionNumber);
    }, [chooseVersionNumber, nextVersionNumber]);

    useEffect(() => {
        if (preventConfirm) {
            setSourceVersionsErrors(WITH_ERROR);
        } else if (sourceVersionErrors.length > 0) {
            setSourceVersionsErrors(EMPTY_ERROR);
        }
    }, [preventConfirm, sourceVersionErrors.length]);

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
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            allowConfimAdditionalButton={!preventConfirm}
            allowConfirm={!preventConfirm}
            onAdditionalButtonClick={onRedirect}
            onCancel={onCancel}
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
                        <Grid item xs={12}>
                            <InputComponent
                                keyValue={chooseVersionKey}
                                type="checkbox"
                                labelString={formatMessage(
                                    MESSAGES.chooseVersionNumber,
                                )}
                                onChange={change(setChooseVersionNumber)}
                                value={chooseVersionNumber}
                            />
                        </Grid>
                    </Grid>
                    {chooseVersionNumber && (
                        <Grid container item xs={6}>
                            <Grid item xs={12}>
                                {/* MarginBottom needed to align type number with type select, as number is not wrapped in a Box in library source code */}
                                <Select
                                    keyValue={destinationVersionKey}
                                    type="select"
                                    labelString={formatMessage(
                                        MESSAGES.destinationVersion,
                                    )}
                                    onChange={value => {
                                        setDestinationVersionNumber(
                                            value ?? `${nextVersionNumber}`,
                                        );
                                    }}
                                    errors={sourceVersionErrors}
                                    options={sourceVersionsDropDown}
                                    value={destinationVersionNumber}
                                    disabled={!chooseVersionNumber}
                                    helperText={errorMessage}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <InputComponent
                                    keyValue={forceOverwriteKey}
                                    type="checkbox"
                                    labelString={formatMessage(
                                        MESSAGES.forceOverwrite,
                                    )}
                                    onChange={change(setForceOverwrite)}
                                    value={forceOverwrite}
                                    disabled={
                                        !destinationVersionNumber ||
                                        destinationVersionNumber ===
                                            nextVersionNumber
                                    }
                                />
                            </Grid>
                        </Grid>
                    )}
                    <Grid container item xs={12}>
                        <WarningMessage
                            dataSourceName={dataSourceName}
                            dataSourceVersionNumber={dataSourceVersionNumber}
                            destinationSourceId={destinationSourceId}
                            destinationVersionNumber={warningVersionNumber}
                            forceOverwrite={forceOverwrite}
                        />
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
