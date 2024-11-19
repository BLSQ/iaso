import { Grid, Tab, Tooltip } from '@mui/material';
import React, { FunctionComponent } from 'react';
import InfoIcon from '@mui/icons-material/Info';

type Props = {
    label: string;
    disabled: boolean;
    tooltipMessage: string;
};
const UsersDialogTabDisabled: FunctionComponent<Props> = ({
    tooltipMessage,
    ...tabProps
}) => {
    return (
        <Grid container alignItems="center">
            <Grid item>
                <Tab label={tabProps.label} disabled={tabProps.disabled} />
            </Grid>
            <Grid item>
                <Tooltip title={tooltipMessage} arrow>
                    <InfoIcon color="primary" style={{ cursor: 'pointer' }} />
                </Tooltip>
            </Grid>
        </Grid>
    );
};

export default UsersDialogTabDisabled;
