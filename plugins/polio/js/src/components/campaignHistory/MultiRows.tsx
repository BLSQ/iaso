import React, { FunctionComponent } from 'react';
import { Table, TableBody, makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { Row } from './Row';
import { CampaignLogData } from '../../constants/types';
import { ExpandableItem } from '../../../../../../hat/assets/js/apps/Iaso/domains/app/components/ExpandableItem';
import { IntlMessage } from '../../../../../../hat/assets/js/apps/Iaso/types/intl';

import { useGetMapLog } from './useGetMapLog';
import { Head } from './Head';

type RowObjectProps = {
    logKey: string;
    logDetail: CampaignLogData;
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
                            return (
                                <Row
                                    cellWithMargin={false}
                                    key={`${logKey}-${index}`}
                                    value={
                                        <ExpandableItem
                                            backgroundColor="#f7f7f7"
                                            // TO DO : implement useGetChildrenLabel
                                            label={`${formatMessage(
                                                childrenLabel,
                                            )} ${index + 1}`}
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
