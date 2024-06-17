import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlareIcon from '@mui/icons-material/Flare';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Box, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import MESSAGES from '../../messages';
import { OrgUnit } from '../../types/orgUnit';

const orgUnitTreeviewStatusIconsStyle = theme => ({
    valid: {
        color: theme.palette.success.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
    new: {
        color: theme.palette.primary.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
    rejected: {
        color: theme.palette.error.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
});

const useStyles = makeStyles(orgUnitTreeviewStatusIconsStyle);

const style = {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
};

type Props = {
    orgUnit: OrgUnit;
};
export const OrgUnitStatusIcon: FunctionComponent<Props> = ({ orgUnit }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    if (orgUnit?.validation_status === 'NEW')
        // The icon has to be wrapped, otherwise Tooltip will crash
        return (
            <Tooltip title={formatMessage(MESSAGES.statusNew)}>
                <Box sx={style}>
                    <FlareIcon fontSize="small" className={classes.new} />
                </Box>
            </Tooltip>
        );
    if (orgUnit?.validation_status === 'VALID')
        return (
            <Tooltip title={formatMessage(MESSAGES.statusValid)}>
                <Box sx={style}>
                    <CheckCircleOutlineIcon
                        fontSize="small"
                        className={classes.valid}
                    />
                </Box>
            </Tooltip>
        );
    if (orgUnit?.validation_status === 'REJECTED')
        return (
            <Tooltip title={formatMessage(MESSAGES.statusRejected)}>
                <Box sx={style}>
                    <HighlightOffIcon
                        fontSize="small"
                        className={classes.rejected}
                    />
                </Box>
            </Tooltip>
        );
    return null;
};
