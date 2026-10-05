import React, { FunctionComponent } from 'react';
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
import { useSafeIntl } from 'bluesquare-components';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { useHumanReadableJsonLogicForForm } from '../../workflows/hooks/useHumanReadableJsonLogicForForm';
import MESSAGES from '../messages';
import { WorkflowImpact } from '../requests';

type Props = {
    // the form the new version is uploaded for, the reference form of the entity types whose follow-ups read it
    formId: number;
    workflowImpacts: WorkflowImpact[];
};

const FormVersionsWorkflowImpactsTable: FunctionComponent<Props> = ({
    formId,
    workflowImpacts,
}) => {
    const { formatMessage } = useSafeIntl();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogicForForm(formId);
    const user = useCurrentUser();
    const canSeeWorkflows = userHasPermission(Permission.WORKFLOWS, user);

    const usage = (impact: WorkflowImpact) =>
        impact.kind === 'follow_up_condition' ? (
            <>
                {formatMessage(MESSAGES.workflowFollowUpCondition, {
                    order: `${impact.follow_up_order}`,
                })}
                {impact.follow_up_condition && (
                    <Typography variant="body2" color="textSecondary">
                        {getHumanReadableJsonLogic(
                            impact.follow_up_condition as JsonLogicTree,
                        )}
                    </Typography>
                )}
            </>
        ) : (
            formatMessage(MESSAGES.workflowChangeMapping, {
                source: impact.mapping_source ?? '',
                target: impact.mapping_target ?? '',
            })
        );

    return (
        <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom color="warning.main">
                {formatMessage(MESSAGES.workflowImpactsSection, {
                    count: `${workflowImpacts.length}`,
                })}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.questionName)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.workflowEntityType)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.workflowVersion)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.workflowUsage)}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {workflowImpacts.map(impact => (
                        <TableRow
                            key={`${impact.kind}-${impact.workflow_version_id}-${impact.question}-${impact.follow_up_order ?? impact.mapping_source}`}
                        >
                            <TableCell>{impact.question}</TableCell>
                            <TableCell>{impact.entity_type_name}</TableCell>
                            <TableCell>
                                <LinkTo
                                    condition={canSeeWorkflows}
                                    url={`/${baseUrls.workflowDetail}/entityTypeId/${impact.entity_type_id}/versionId/${impact.workflow_version_id}`}
                                    text={`${impact.workflow_version_name} (${impact.workflow_version_status})`}
                                    target="_blank"
                                />
                            </TableCell>
                            <TableCell>{usage(impact)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default FormVersionsWorkflowImpactsTable;
