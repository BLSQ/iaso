import React, { FunctionComponent } from 'react';
import { Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    ExpandableItem,
    IntlMessage,
} from 'bluesquare-components';
import { Row } from './Row';
import { Campaign } from '../../../constants/types';

import { useGetMapLog } from './useGetMapLog';
import { Head } from './Head';

type RowObjectProps = {
    logKey: string;
    logDetail: Campaign;
    childrenArray: Record<string, any>[];
    childrenLabel: IntlMessage;
    type: 'array' | 'object';
};

const useStyles = makeStyles(() => ({
    table: {
        '& tr:last-child > td': {
            borderBottom: 'none',
        },
    },
}));
export const MultiRows: FunctionComponent<RowObjectProps> = ({
    logKey,
    logDetail,
    childrenArray,
    childrenLabel,
    type,
}) => {
    const classes: Record<string, string> = useStyles();

    const { formatMessage } = useSafeIntl();
    const getMapLog = useGetMapLog(childrenArray);
    const items = type === 'array' ? logDetail[logKey] : childrenArray;

    return (
        <Row
            cellWithMargin={false}
            key={logKey}
            value={
                <Table size="small" className={classes.table}>
                    <TableBody>
                        {items.map((subItem, index) => {
                            const item =
                                type === 'array' ? subItem : logDetail[logKey];
                            const multiRowIndex =
                                logKey === 'rounds' &&
                                logDetail.rounds[0].number === 0
                                    ? index
                                    : index + 1;
                            return (
                                <Row
                                    cellWithMargin={false}
                                    key={`${logKey}-${index}`}
                                    value={
                                        <ExpandableItem
                                            backgroundColor="#f7f7f7"
                                            label={`${formatMessage(
                                                childrenLabel,
                                            )} ${multiRowIndex}`}
                                        >
                                            <Table size="small">
                                                <Head />
                                                <TableBody>
                                                    {childrenArray &&
                                                        getMapLog(item)}
                                                </TableBody>
                                            </Table>
                                        </ExpandableItem>
                                    }
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            }
            fieldKey={logKey}
        />
    );
};
