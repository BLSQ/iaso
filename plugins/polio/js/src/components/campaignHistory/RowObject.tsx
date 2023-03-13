import React, { FunctionComponent } from 'react';
import { Table, TableBody } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { Row } from './Row';
import { CampaignLogData } from '../../constants/types';
import { ExpandableItem } from '../../../../../../hat/assets/js/apps/Iaso/domains/app/components/ExpandableItem';
import { IntlMessage } from '../../../../../../hat/assets/js/apps/Iaso/types/intl';
import { mapLogStructure } from './mapStructure';

type RowObjectProps = {
    logKey: string;
    logDetail: CampaignLogData;
    childrenArray: Record<any, any>[];
    childrenLabel: IntlMessage;
    type: 'array' | 'object';
};

export const RowObject: FunctionComponent<RowObjectProps> = ({
    logKey,
    logDetail,
    childrenArray,
    childrenLabel,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
    const items = type === 'array' ? logDetail[logKey] : childrenArray;
    return (
        <Row
            key={logKey}
            value={
                <Table size="small">
                    <TableBody>
                        {items.map((subItem, index) => {
                            const item =
                                type === 'array' ? subItem : logDetail[logKey];
                            return (
                                <Row
                                    key={index}
                                    value={
                                        <ExpandableItem
                                            // TO DO : implement useGetChildrenLabel
                                            label={`${formatMessage(
                                                childrenLabel,
                                            )} ${index + 1}`}
                                        >
                                            <Table size="small">
                                                <TableBody>
                                                    {childrenArray &&
                                                        mapLogStructure(
                                                            childrenArray,
                                                            item,
                                                        )}
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
