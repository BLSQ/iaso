import React, { FunctionComponent, ReactNode } from 'react';
import { Typography } from '@mui/material';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { ConfigurationImpact } from '../requests';

type Props = {
    impact: ConfigurationImpact;
    // of the form, computed once for the whole table
    getHumanReadableJsonLogic: (logic?: JsonLogicTree) => ReactNode;
};

type Kind = ConfigurationImpact['kind'];

// typed by kind: a kind missing here fails the build
const KIND_MESSAGES: Record<Kind, IntlMessage> = {
    location_field: MESSAGES.impactLocationField,
    device_field: MESSAGES.impactDeviceField,
    correlation_field: MESSAGES.impactCorrelationField,
    label_key: MESSAGES.impactLabelKey,
    predefined_filter: MESSAGES.impactPredefinedFilter,
    entity_type_list_field: MESSAGES.impactEntityTypeListField,
    entity_type_detail_field: MESSAGES.impactEntityTypeDetailField,
    entity_type_duplicate_field: MESSAGES.impactEntityTypeDuplicateField,
    stock_rule: MESSAGES.impactStockRule,
    dhis2_mapping: MESSAGES.impactDhis2Mapping,
    follow_up_condition: MESSAGES.impactFollowUpCondition,
    change_mapping: MESSAGES.impactChangeMapping,
};

// What of the configuration reads the question
export const FormVersionsConfigurationImpactUsage: FunctionComponent<Props> = ({
    impact,
    getHumanReadableJsonLogic,
}) => {
    const { formatMessage } = useSafeIntl();
    // a kind this bundle doesn't know (an older bundle against a newer backend): its raw name
    const kindMessage: IntlMessage | undefined = KIND_MESSAGES[impact.kind];
    const message = kindMessage
        ? formatMessage(kindMessage, {
              order: `${impact.follow_up_order}`,
              source: impact.mapping_source ?? '',
              target: impact.mapping_target ?? '',
          })
        : impact.kind;
    // breaks the processing of the submissions, not only what is shown
    if (impact.kind === 'correlation_field') {
        return (
            <Typography variant="body2" color="error">
                {message}
            </Typography>
        );
    }
    if (!impact.condition) {
        return <>{message}</>;
    }
    return (
        <>
            {message}
            <Typography variant="body2" color="textSecondary">
                {getHumanReadableJsonLogic(impact.condition as JsonLogicTree)}
            </Typography>
        </>
    );
};
