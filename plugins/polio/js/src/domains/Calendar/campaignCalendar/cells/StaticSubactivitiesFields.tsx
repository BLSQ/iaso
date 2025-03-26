import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';

import MESSAGES from '../../../../constants/messages';
import { useStaticFields } from '../../hooks/useStaticFields';
import { colSpanTitle } from '../constants';
import { useStyles } from '../Styles';

type Props = {
    isPdf: boolean;
};

export const StaticSubactivitiesFields: FunctionComponent<Props> = ({
    isPdf,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const fields = useStaticFields(isPdf);
    return (
        <TableCell
            colSpan={colSpanTitle * fields.length}
            className={classnames(defaultCellStyles)}
        >
            <Box
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanRow,
                )}
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                }}
            >
                {formatMessage(MESSAGES.subactivities)}
            </Box>
        </TableCell>
    );
};
