import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
    commonStyles,
    IconButton,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, makeStyles, Paper, Typography } from '@material-ui/core';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

import { redirectToReplace } from '../../../routing/actions';
import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';
import { useCurrentUser } from '../../../utils/usersUtils';

import InputComponent from '../../../components/forms/InputComponent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import EnketoIcon from '../../instances/components/EnketoIcon';

import { userHasPermission } from '../../users/utils';
import {
    useGetOrgUnitInstances,
    useGetInstance,
} from '../hooks/useGetInstances';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { RegistryDetailParams } from '../types';

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
                <WidgetPaper
                    id="form-contents"
                    className={classes.paper}
                    elevation={1}
                    title={`${currentInstance.form_name}${
                        currentInstance.id === orgUnit.reference_instance?.id &&
                        ` (${formatMessage(MESSAGES.referenceInstance)})`
                    }`}
                    IconButton={
                        userHasPermission(
                            'iaso_update_submission',
                            currentUser,
                        ) && IconButton
                    }
                    iconButtonProps={{
                        onClick: () => getEnketoUrl(),
                        overrideIcon: EnketoIcon,
                        color: 'secondary',
                        tooltipMessage: MESSAGES.editOnEnketo,
                    }}
                >
                    <Box className={classes.formContents}>
                        <InstanceFileContent
                            instance={currentInstance}
                            showQuestionKey={false}
                        />
                    </Box>
                </WidgetPaper>
            )}
        </Box>
    );
};
