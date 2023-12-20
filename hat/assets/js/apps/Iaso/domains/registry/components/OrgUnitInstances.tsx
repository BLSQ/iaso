import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
    commonStyles,
    IconButton,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Box, Paper, Typography, Grid, Divider } from '@mui/material';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

import { redirectToReplace } from '../../../routing/actions';
import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';
import { useCurrentUser } from '../../../utils/usersUtils';

import InputComponent from '../../../components/forms/InputComponent';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import EnketoIcon from '../../instances/components/EnketoIcon';

import { userHasPermission } from '../../users/utils';
import {
    useGetOrgUnitInstances,
    useGetInstance,
} from '../hooks/useGetInstances';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { RegistryDetailParams } from '../types';
import { LinkToInstance } from '../../instances/components/LinkToInstance';
import * as Permission from '../../../utils/permissions';

type Props = {
    orgUnit: OrgUnit;
    params: RegistryDetailParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
    },
    formContents: {
        maxHeight: '485px',
        overflow: 'auto',
    },
    emptyPaper: {
        height: '636px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyPaperTypo: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyPaperIcon: {
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    paperTitle: {
        padding: theme.spacing(2),
        display: 'flex',
    },
    paperTitleButtonContainer: {
        position: 'relative',
    },
    paperTitleButton: {
        position: 'absolute',
        right: -theme.spacing(1),
        top: -theme.spacing(1),
    },
}));

export const OrgUnitInstances: FunctionComponent<Props> = ({
    orgUnit,
    params,
}) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    // selected instance should be:
    // submission id from params  OR reference instance OR first submission of the possible ones OR undefined
    // if undefined select should be hidden and a place holder should say no submission

    const [currentInstanceId, setCurrentInstanceId] = useState<
        number | string | undefined
    >(params.submissionId || orgUnit.reference_instance?.id);

    const { data: currentInstance, isFetching: isFetchingCurrentInstance } =
        useGetInstance(currentInstanceId);

    const { data: instances, isFetching } = useGetOrgUnitInstances(orgUnit.id);
    const instancesOptions = useMemo(() => {
        return (instances || []).map(instance => ({
            label: `${instance.form_name} (${moment
                .unix(instance.created_at)
                .format('L')})`,
            value: instance.id,
        }));
    }, [instances]);
    const getEnketoUrl = useGetEnketoUrl(window.location.href, currentInstance);
    const currentUser = useCurrentUser();

    const handleChange = (_, submissionId) => {
        setCurrentInstanceId(submissionId);
        const newParams: RegistryDetailParams = {
            ...params,
            submissionId,
        };
        dispatch(redirectToReplace(baseUrls.registryDetail, newParams));
    };
    useEffect(() => {
        if (!currentInstanceId && instances && instances?.length > 0) {
            setCurrentInstanceId(instances[0].id);
        }
    }, [currentInstanceId, instances]);
    return (
        <Box position="relative" width="100%" minHeight={300}>
            {isFetchingCurrentInstance && <LoadingSpinner absolute />}
            {instances && instances?.length === 0 && (
                <Paper className={classes.emptyPaper}>
                    <Typography
                        component="p"
                        className={classes.emptyPaperTypo}
                    >
                        <ErrorOutlineIcon className={classes.emptyPaperIcon} />
                        {formatMessage(MESSAGES.noInstance)}
                    </Typography>
                </Paper>
            )}
            {instances && instances?.length > 0 && (
                <Box
                    width="100%"
                    display="flex"
                    justifyContent="flex-end"
                    mb={2}
                >
                    <Box width="50%">
                        <InputComponent
                            type="select"
                            disabled={
                                isFetching || instancesOptions.length <= 1
                            }
                            keyValue="instance"
                            onChange={handleChange}
                            value={isFetching ? undefined : currentInstanceId}
                            label={MESSAGES.submission}
                            options={instancesOptions}
                            loading={isFetching}
                            clearable={false}
                        />
                    </Box>
                </Box>
            )}
            {currentInstance && (
                <Paper elevation={1} className={classes.paper}>
                    <Grid container className={classes.paperTitle}>
                        <Grid xs={8} item>
                            <Typography
                                color="primary"
                                variant="h5"
                                className={classes.title}
                            >
                                {`${currentInstance.form_name}${
                                    currentInstance.id ===
                                    orgUnit.reference_instance?.id
                                        ? ` (${formatMessage(
                                              MESSAGES.referenceInstance,
                                          )})`
                                        : ''
                                }`}
                            </Typography>
                        </Grid>
                        <Grid
                            xs={4}
                            item
                            container
                            justifyContent="flex-end"
                            className={classes.paperTitleButtonContainer}
                        >
                            <Box className={classes.paperTitleButton}>
                                {userHasPermission(
                                    Permission.SUBMISSIONS_UPDATE,
                                    currentUser,
                                ) && (
                                    <IconButton
                                        onClick={() => getEnketoUrl()}
                                        overrideIcon={EnketoIcon}
                                        color="secondary"
                                        tooltipMessage={MESSAGES.editOnEnketo}
                                    />
                                )}
                                <LinkToInstance
                                    instanceId={`${currentInstance.id}`}
                                    useIcon
                                    color="secondary"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider />
                    <Box className={classes.formContents}>
                        <InstanceFileContent
                            instance={currentInstance}
                            showQuestionKey={false}
                        />
                    </Box>
                </Paper>
            )}
        </Box>
    );
};
