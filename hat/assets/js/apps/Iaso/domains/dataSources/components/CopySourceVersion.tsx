/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Grid, Box, Typography, Divider } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { useCopyDataSourceVersion } from '../requests';
import { redirectTo } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';
import InputComponent from '../../../components/forms/InputComponent';

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

export const CopySourceVersion: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    const [destinationSourceId, setDestinationSourceId] = useState(null);
    const [destinationVersionNumber, setDestinationVersionNumber] =
        useState(null);
    const [chooseVersionNumber, setChooseVersionNumber] = useState(false);
    const [forceOverwrite, setForceOverwrite] = useState(false);
    const { mutateAsync: copyVersion } = useCopyDataSourceVersion();
    const dispatch = useDispatch();
    const change = setter => (_keyValue, value) => {
        setter(value);
    };

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
                <Box>
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
                                options={[]}
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
                                <Box mb={1}>
                                    <InputComponent
                                        keyValue={destinationVersionKey}
                                        type="number"
                                        labelString="destination version"
                                        onChange={change(
                                            setDestinationVersionNumber,
                                        )}
                                        value={destinationVersionNumber}
                                        disabled={!chooseVersionNumber}
                                    />
                                </Box>
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
                    {/* <Grid container item xs={12}>
                        <div>Warning message</div>
                    </Grid> */}
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
