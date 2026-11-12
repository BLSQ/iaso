import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { LabeledValue } from './LabeledValue';
import { emptyValue, summaryStyles, SummaryItemProps } from './summaryUtils';

// EVENT_TRACKER repeat group mapping: { type: 'repeat', program_id, ... }
export const RepeatSummary: FunctionComponent<SummaryItemProps> = ({
    item,
    emptyLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={summaryStyles.item}>
            <LabeledValue
                label={formatMessage(MESSAGES.program)}
                value={
                    item.program_name ??
                    item.program_id ??
                    emptyValue(emptyLabel)
                }
                dhis2Id={item.program_name ? item.program_id : undefined}
                reserveIdLine
                large
            />
            <Box sx={summaryStyles.fields}>
                <LabeledValue
                    label={formatMessage(MESSAGES.trackedEntityType)}
                    value={item.tracked_entity_type}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.trackerEntityIdentifier)}
                    value={item.tracked_entity_identifier}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.relationshipType)}
                    value={
                        item.relationship_type_name ?? item.relationship_type
                    }
                    dhis2Id={
                        item.relationship_type_name
                            ? item.relationship_type
                            : undefined
                    }
                />
            </Box>
        </Box>
    );
};
