/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, TableCell, TableHead, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';
import MESSAGES from '../../messages';

type Props = {
    isNew: boolean;
};

const useStyles = makeStyles(() => ({
    head: {
        fontWeight: 'bold',
    },
}));

export const ReviewOrgUnitChangesDetailsTableHead: FunctionComponent<Props> = ({
    isNew,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <TableHead>
            <TableRow>
                <TableCell width={150}>
                    <Box className={classes.head}>
                        {formatMessage(MESSAGES.label)}
                    </Box>
                </TableCell>
                <TableCell width={300}>
                    <Box className={classes.head}>
                        {formatMessage(MESSAGES.oldValue)}
                    </Box>
                </TableCell>
                <TableCell width={300}>
                    <Box className={classes.head}>
                        {formatMessage(MESSAGES.newValue)}
                    </Box>
                </TableCell>
                {isNew && (
                    <TableCell width={100}>
                        <Box
                            className={classes.head}
                            display="flex"
                            justifyContent="center"
                        >
                            {formatMessage(MESSAGES.selection)}
                        </Box>
                    </TableCell>
                )}
            </TableRow>
        </TableHead>
    );
};
