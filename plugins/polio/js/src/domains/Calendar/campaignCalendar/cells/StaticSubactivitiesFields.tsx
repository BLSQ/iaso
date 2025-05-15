import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';

import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { useStaticFields } from '../../hooks/useStaticFields';
import { colSpanTitle } from '../constants';
import { useStyles } from '../Styles';
import { SubActivity } from '../types';

type Props = {
    isPdf: boolean;
    subActivity: SubActivity;
    displayRoundCell: boolean;
    roundNumber: number;
    subActivitiesCount: number;
};
const styles: SxStyles = {
    roundCell: {
        display: 'flex',
        justifyContent: 'center',
        fontSize: '9px',
    },
    subactivityCell: {
        display: 'flex',
        justifyContent: 'center',
    },
};

export const StaticSubactivitiesFields: FunctionComponent<Props> = ({
    isPdf,
    subActivity,
    displayRoundCell,
    roundNumber,
    subActivitiesCount,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const fields = useStaticFields(isPdf);
    return (
        <>
            {displayRoundCell && (
                <TableCell
                    rowSpan={subActivitiesCount}
                    className={classnames(defaultCellStyles)}
                >
                    <Box sx={styles.roundCell}>R{roundNumber}</Box>
                </TableCell>
            )}
            <TableCell
                colSpan={colSpanTitle * fields.length - 1}
                className={classnames(defaultCellStyles)}
            >
                <Box
                    className={classnames(
                        classes.tableCellSpan,
                        classes.tableCellSpanRow,
                    )}
                    sx={styles.subactivityCell}
                >
                    {formatMessage(MESSAGES.subactivity)}: {subActivity.name}
                </Box>
            </TableCell>
        </>
    );
};
