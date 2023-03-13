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
};

export const RowObject: FunctionComponent<RowObjectProps> = ({
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
                        {childrenArray.map((children, index) => {
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
                                                            logDetail[logKey],
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
