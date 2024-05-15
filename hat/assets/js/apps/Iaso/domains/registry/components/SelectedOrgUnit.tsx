import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    IconButton,
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import moment from 'moment';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

import { redirectToReplace } from '../../../routing/actions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';

import InputComponent from '../../../components/forms/InputComponent';
import EnketoIcon from '../../instances/components/EnketoIcon';
import InstanceFileContent from '../../instances/components/InstanceFileContent';

import { userHasPermission } from '../../users/utils';
import {
    useGetInstance,
    useGetOrgUnitInstances,
} from '../hooks/useGetInstances';

import * as Permission from '../../../utils/permissions';
import { LinkToInstance } from '../../instances/components/LinkToInstance';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { HEIGHT } from '../config';
import { RegistryParams } from '../types';

type Props = {
    orgUnit?: OrgUnit;
    params: RegistryParams;
    isFetching: boolean;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
        height: HEIGHT,
    },
    subTitle: {
        fontSize: '1.15rem',
    },
    formContents: {
        maxHeight: `calc(${HEIGHT} - 222px)`,
        overflow: 'auto',
    },
    emptyPaper: {
        height: '527px',
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

export const SelectedOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    params,
    isFetching: isFetchingOrgUnit,
}) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    // selected instance should be:
    // submission id from params  OR reference instance OR first submission of the possible ones OR undefined
    // if undefined select should be hidden and a place holder should say no submission
    // console.log('orgUnit', orgUnit);
    const [currentInstanceId, setCurrentInstanceId] = useState<
        number | string | undefined
    >(params.submissionId || orgUnit?.reference_instances?.[0]?.id);

    const { data: currentInstance, isFetching: isFetchingCurrentInstance } =
        useGetInstance(currentInstanceId);

    const { data: instances, isFetching } = useGetOrgUnitInstances(orgUnit?.id);
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
        const newParams: RegistryParams = {
            ...params,
            submissionId,
        };
        dispatch(redirectToReplace(baseUrls.registry, newParams));
    };
    const isReferenceInstance = orgUnit?.reference_instances?.some(
        ref => ref.id === currentInstance?.id,
    );
    const referenceInstanceMessage = isReferenceInstance
        ? ` (${formatMessage(MESSAGES.referenceInstance)})`
        : '';
    useEffect(() => {
        if (!currentInstanceId && instances && instances?.length > 0) {
            setCurrentInstanceId(instances[0].id);
        }
    }, [currentInstanceId, instances]);
    if (!orgUnit) {
        return null;
    }
    return (
        <Box position="relative" width="100%" minHeight={HEIGHT}>
            {(isFetchingCurrentInstance || isFetchingOrgUnit) && (
                <LoadingSpinner absolute />
            )}

            <Paper className={classes.paper}>
                <Grid container className={classes.paperTitle}>
                    <Grid xs={8} item>
                        <Typography
                            color="primary"
                            variant="h6"
                            className={classes.title}
                        >
                            {orgUnit.name} ({orgUnit.org_unit_type_name})
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
                            <IconButton
                                url={`${baseUrls.orgUnitDetails}/orgUnitId/0/levels/${orgUnit.id}`}
                                color="secondary"
                                overrideIcon={AddIcon}
                                tooltipMessage={MESSAGES.addOrgUnitChild}
                            />
                            <IconButton
                                url={`${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
                                color="secondary"
                                icon="edit"
                                tooltipMessage={MESSAGES.editOrgUnit}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Divider />
                {instances && instances?.length === 0 && (
                    <Box className={classes.emptyPaper}>
                        <Typography
                            component="p"
                            className={classes.emptyPaperTypo}
                        >
                            <ErrorOutlineIcon
                                className={classes.emptyPaperIcon}
                            />
                            {formatMessage(MESSAGES.noInstance)}
                        </Typography>
                    </Box>
                )}
                {instances && instances?.length > 0 && (
                    <Box
                        width="100%"
                        display="flex"
                        justifyContent="flex-end"
                        mb={2}
                        px={2}
                    >
                        <Box width="50%">
                            <InputComponent
                                type="select"
                                disabled={
                                    isFetching || instancesOptions.length <= 1
                                }
                                keyValue="instance"
                                onChange={handleChange}
                                value={
                                    isFetching ? undefined : currentInstanceId
                                }
                                label={MESSAGES.submission}
                                options={instancesOptions}
                                loading={isFetching}
                                clearable={false}
                            />
                        </Box>
                    </Box>
                )}

                {instances && instances?.length > 0 && currentInstance && (
                    <Divider />
                )}
                {currentInstance && (
                    <>
                        <Grid container className={classes.paperTitle}>
                            <Grid xs={8} item>
                                <Typography
                                    color="primary"
                                    variant="h6"
                                    className={classes.subTitle}
                                >
                                    {`${currentInstance.form_name}${referenceInstanceMessage}`}
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
                                            tooltipMessage={
                                                MESSAGES.editOnEnketo
                                            }
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
                    </>
                )}
            </Paper>
        </Box>
    );
};
