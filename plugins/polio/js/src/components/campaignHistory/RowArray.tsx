import React, { FunctionComponent } from 'react';
import { Table, TableBody } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { Row } from './Row';
import { CampaignLogData } from '../../constants/types';
import { ExpandableItem } from '../../../../../../hat/assets/js/apps/Iaso/domains/app/components/ExpandableItem';
import { IntlMessage } from '../../../../../../hat/assets/js/apps/Iaso/types/intl';

type RowArrayProps = {
    logKey: string;
    logDetail: CampaignLogData;
    childrenArray: Record<any, any>[];
    childrenLabel: IntlMessage;
};

export const RowArray: FunctionComponent<RowArrayProps> = ({
    logKey,
    logDetail,
    childrenArray,
    childrenLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Row
            key={logKey}
            value={
                <Table size="small">
                    <TableBody>
                        {logDetail[logKey].map((arrayItem, index) => {
                            return (
                                <Row
                                    key={`Round${index}`}
                                    value={
                                        <ExpandableItem
                                            label={`${formatMessage(
                                                childrenLabel,
                                            )} ${index}`}
                                        >
                                            <Table size="small">
                                                <TableBody>
                                                    {childrenArray.map(
                                                        child => (
                                                            <Row
                                                                key={child.key}
                                                                value={
                                                                    arrayItem[
                                                                        child
                                                                            .key
                                                                    ]
                                                                }
                                                            />
                                                        ),
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
