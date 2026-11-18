import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { isOrgUnitTarget, ORG_UNIT_IASO_FIELD } from '../../utils';
import { LabeledValue } from './LabeledValue';
import {
    emptyValue,
    nameOrId,
    summaryStyles,
    SummaryItemProps,
} from './summaryUtils';

// EVENT_TRACKER mapping item: { dataElement | trackedEntityAttribute, ... }
export const TrackerItemSummary: FunctionComponent<SummaryItemProps> = ({
    item,
    emptyLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    const target = item.dataElement ?? item.trackedEntityAttribute ?? {};
    return (
        <Box sx={summaryStyles.item}>
            <LabeledValue
                label={formatMessage(
                    item.trackedEntityAttribute
                        ? MESSAGES.trackedEntityAttribute
                        : MESSAGES.programDataElement,
                )}
                value={nameOrId(target) ?? emptyValue(emptyLabel)}
                dhis2Id={
                    (target.displayName ?? target.name) ? target.id : undefined
                }
                reserveIdLine
                large
            />
            <Box sx={summaryStyles.fields}>
                <LabeledValue
                    label={formatMessage(MESSAGES.valueType)}
                    value={target.valueType ?? item.valueType}
                />
                {(isOrgUnitTarget(item) || item.iaso_field) && (
                    <LabeledValue
                        label={formatMessage(MESSAGES.useInstanceProperty)}
                        value={
                            item.iaso_field === ORG_UNIT_IASO_FIELD
                                ? formatMessage(MESSAGES.instanceOrgUnit)
                                : (item.iaso_field ??
                                  formatMessage(MESSAGES.useValueFromForm))
                        }
                    />
                )}
            </Box>
        </Box>
    );
};
