import React, { FunctionComponent } from 'react';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import MuiIconButton from '@mui/material/IconButton/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../domains/app/components/messages';

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
