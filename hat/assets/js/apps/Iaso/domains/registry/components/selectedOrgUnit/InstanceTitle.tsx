import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton, commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import MESSAGES from '../../messages';

import { useCurrentUser } from '../../../../utils/usersUtils';
import { useGetEnketoUrl } from '../../hooks/useGetEnketoUrl';

import EnketoIcon from '../../../instances/components/EnketoIcon';

import { userHasPermission } from '../../../users/utils';

import * as Permission from '../../../../utils/permissions';
import { LinkToInstance } from '../../../instances/components/LinkToInstance';
import { Instance } from '../../../instances/types/instance';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';

type Props = {
    orgUnit?: OrgUnit;
    currentInstance: Instance;
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
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const getEnketoUrl = useGetEnketoUrl(window.location.href, currentInstance);
    const currentUser = useCurrentUser();
    const isReferenceInstance = orgUnit?.reference_instances?.some(
        ref => ref.id === currentInstance?.id,
    );
    const referenceInstanceMessage = isReferenceInstance
        ? ` (${formatMessage(MESSAGES.referenceInstance)})`
        : '';
    return (
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
        </Grid>
    );
};
