import React, { ReactElement } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
    root: {
        overflowWrap: 'anywhere',
    },
}));

export const BreakWordCell = (cellInfo: { value?: string }): ReactElement => {
    const value = cellInfo?.value;
    const classes = useStyles();
    return <Box className={classes.root}>{value || '--'}</Box>;
};
