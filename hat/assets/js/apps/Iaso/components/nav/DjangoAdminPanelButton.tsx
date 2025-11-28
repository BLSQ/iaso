import React, { FunctionComponent } from 'react';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../domains/app/components/messages';
import { AdminPanelSettings } from '@mui/icons-material';

const useStyles = makeStyles(theme => ({
    djangoAdminPanelButton: {
        padding: theme.spacing(0),
    },
}));

type Props = {
    color?: 'inherit' | 'primary' | 'secondary';
};

export const DjangoAdminPanelButton: FunctionComponent<Props> = ({
    color = 'inherit',
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip arrow title={formatMessage(MESSAGES.djangoAdmin)}>
            <MuiIconButton
                className={classes.djangoAdminPanelButton}
                color={color}
                href="/admin/"
                id="top-bar-admin-panel-button"
                target="_blank"
                rel="noreferrer"
            >
                <AdminPanelSettings />
            </MuiIconButton>
        </Tooltip>
    );
};
