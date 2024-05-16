import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton, commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useMemo } from 'react';

import moment from 'moment';
import { useDispatch } from 'react-redux';
import MESSAGES from '../../messages';

import { useCurrentUser } from '../../../../utils/usersUtils';
import { useGetEnketoUrl } from '../../hooks/useGetEnketoUrl';

import EnketoIcon from '../../../instances/components/EnketoIcon';

import { userHasPermission } from '../../../users/utils';

import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { redirectToReplace } from '../../../../routing/actions';
import * as Permission from '../../../../utils/permissions';
import { LinkToInstance } from '../../../instances/components/LinkToInstance';
import { Instance } from '../../../instances/types/instance';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { RegistryParams } from '../../types';

type Props = {
    orgUnit?: OrgUnit;
    currentInstance?: Instance;
    params: RegistryParams;
    instances: Instance[];
    isFetching: boolean;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    subTitle: {
        fontSize: '1.15rem',
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

export const InstanceTitle: FunctionComponent<Props> = ({
    orgUnit,
    currentInstance,
    params,
    instances,
    isFetching,
}) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const getEnketoUrl = useGetEnketoUrl(window.location.href, currentInstance);
    const currentUser = useCurrentUser();

    const currentInstanceId = useMemo(() => {
        return params.submissionId || orgUnit?.reference_instances?.[0]?.id;
    }, [params.submissionId, orgUnit]);

    const instancesOptions = useMemo(() => {
        return (instances || []).map(instance => {
            const isReferenceInstance = orgUnit?.reference_instances?.some(
                ref => ref.id === instance.id,
            );
            const label = `${instance.form_name} (${
                isReferenceInstance
                    ? `${formatMessage(MESSAGES.referenceInstance)} - `
                    : ''
            }${moment.unix(instance.created_at).format('LTS')})`;
            return {
                label,
                value: instance.id,
            };
        });
    }, [formatMessage, instances, orgUnit?.reference_instances]);

    const handleChange = useCallback(
        (_, submissionId) => {
            const newParams: RegistryParams = {
                ...params,
                submissionId,
            };
            dispatch(redirectToReplace(baseUrls.registry, newParams));
        },
        [params, dispatch],
    );
    return (
        <Grid container className={classes.paperTitle}>
            <Grid xs={8} item>
                <InputComponent
                    type="select"
                    disabled={isFetching}
                    keyValue="instance"
                    onChange={handleChange}
                    value={isFetching ? undefined : currentInstanceId}
                    label={MESSAGES.submission}
                    options={instancesOptions}
                    loading={isFetching}
                    clearable={false}
                    withMarginTop={false}
                />
            </Grid>
            {currentInstance && (
                <Grid
                    xs={4}
                    item
                    container
                    justifyContent="flex-end"
                    alignItems="center"
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
                                iconSize="small"
                                size="small"
                                tooltipMessage={MESSAGES.editOnEnketo}
                            />
                        )}
                        <LinkToInstance
                            instanceId={`${currentInstance.id}`}
                            useIcon
                            color="secondary"
                            iconSize="small"
                            size="small"
                        />
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};
