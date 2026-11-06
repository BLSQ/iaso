import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import TableCell from '@mui/material/TableCell/TableCell';
import TableHead from '@mui/material/TableHead/TableHead';
import TableRow from '@mui/material/TableRow/TableRow';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

type Props = {
    isNew: boolean;
    isNewOrgUnit: boolean;
};

const useStyles = makeStyles(() => ({
    head: {
        fontWeight: 'bold',
    },
}));

export const ReviewOrgUnitChangesDetailsTableHead: FunctionComponent<Props> = ({
    isNew,
    isNewOrgUnit,
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
                {!isNewOrgUnit && (
                    <TableCell width={350}>
                        <Box className={classes.head}>
                            {formatMessage(MESSAGES.oldValue)}
                        </Box>
                    </TableCell>
                )}
                <TableCell width={350}>
                    <Box className={classes.head}>
                        {isNewOrgUnit
                            ? formatMessage(MESSAGES.value)
                            : formatMessage(MESSAGES.newValue)}
                    </Box>
                </TableCell>
                {isNew && !isNewOrgUnit && (
                    <TableCell width={30}>
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
