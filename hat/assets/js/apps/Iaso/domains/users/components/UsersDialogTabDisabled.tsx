import React, { FunctionComponent } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Grid, Tab, Tooltip } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    label: string;
    disabled: boolean;
    tooltipMessage: string;
};

const styles: SxStyles = {
    tab: {
        marginBottom: theme => theme.spacing(1),
    },
};

const UsersDialogTabDisabled: FunctionComponent<Props> = ({
    tooltipMessage,
    ...tabProps
}) => {
    return (
        <Grid container alignItems="center" sx={styles.tab}>
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
