import React, { FunctionComponent, ReactNode } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { useHumanReadableJsonLogicForForm } from '../../workflows/hooks/useHumanReadableJsonLogicForForm';
import MESSAGES from '../messages';
import { ConfigurationImpact } from '../requests';

type Props = {
    // the form the new version is uploaded for
    formId: number;
    configurationImpacts: ConfigurationImpact[];
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

// The page to check the configuration on, and the permission it needs - none for a kind this bundle doesn't know
const getLink = (
    impact: ConfigurationImpact,
    formId: number,
): { url: string; permission: string } | undefined => {
    switch (impact.kind) {
        case 'location_field':
        case 'device_field':
        case 'correlation_field':
        case 'label_key':
            return {
                url: `/${baseUrls.formDetail}/formId/${formId}`,
                permission: Permission.FORMS,
            };
        case 'predefined_filter':
            return {
                url: `/${baseUrls.formDetail}/formId/${formId}/tab/filters`,
                permission: Permission.FORMS,
            };
        case 'entity_type_list_field':
        case 'entity_type_detail_field':
        case 'entity_type_duplicate_field':
            return {
                url: `/${baseUrls.entityTypes}/search/${encodeURIComponent(impact.target_name)}`,
                permission: Permission.ENTITIES,
            };
        case 'stock_rule':
            return {
                url: `/${baseUrls.stockRulesVersions}/versionId/${impact.target_id}`,
                permission: Permission.STOCK_MANAGEMENT,
            };
        case 'dhis2_mapping':
            return {
                url: `/${baseUrls.mappingDetail}/mappingVersionId/${impact.target_id}`,
                permission: Permission.MAPPINGS,
            };
        case 'follow_up_condition':
        case 'change_mapping':
            return {
                url: `/${baseUrls.workflowDetail}/entityTypeId/${impact.entity_type_id}/versionId/${impact.target_id}`,
                permission: Permission.WORKFLOWS,
            };
        default:
            return undefined;
    }
};

const FormVersionsConfigurationImpactsTable: FunctionComponent<Props> = ({
    formId,
    configurationImpacts,
}) => {
    const { formatMessage } = useSafeIntl();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogicForForm(formId);
    const user = useCurrentUser();

    const usage = (impact: ConfigurationImpact): ReactNode => {
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
            return message;
        }
        return (
            <>
                {message}
                <Typography variant="body2" color="textSecondary">
                    {getHumanReadableJsonLogic(
                        impact.condition as JsonLogicTree,
                    )}
                </Typography>
            </>
        );
    };

    return (
        <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom color="warning.main">
                {formatMessage(MESSAGES.configurationImpactsSection, {
                    count: `${configurationImpacts.length}`,
                })}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.questionName)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.configurationUsage)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.configurationTarget)}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {configurationImpacts.map(impact => {
                        const link = getLink(impact, formId);
                        return (
                            <TableRow
                                key={`${impact.kind}-${impact.target_id}-${impact.question}-${impact.follow_up_order ?? impact.mapping_source}`}
                            >
                                <TableCell>{impact.question}</TableCell>
                                <TableCell>{usage(impact)}</TableCell>
                                <TableCell>
                                    <LinkTo
                                        condition={
                                            !!link &&
                                            userHasPermission(
                                                link.permission,
                                                user,
                                            )
                                        }
                                        url={link?.url ?? ''}
                                        text={impact.target_name}
                                        target="_blank"
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );
};

export default FormVersionsConfigurationImpactsTable;
