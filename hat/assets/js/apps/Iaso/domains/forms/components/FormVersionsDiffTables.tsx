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
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { WorkflowImpact } from '../requests';

type RemovedQuestion = { name: string; label: string; type: string };
type ModifiedQuestion = {
    name: string;
    label: string;
    old_type: string;
    new_type: string;
};

type Props = {
    removedQuestions: RemovedQuestion[];
    modifiedQuestions: ModifiedQuestion[];
    workflowImpacts?: WorkflowImpact[];
};

const FormVersionsDiffTables: FunctionComponent<Props> = ({
    removedQuestions,
    modifiedQuestions,
    workflowImpacts = [],
}) => {
    const { formatMessage } = useSafeIntl();
    const usage = (impact: WorkflowImpact): string =>
        impact.kind === 'follow_up_condition'
            ? formatMessage(MESSAGES.workflowFollowUpCondition, {
                  order: `${impact.follow_up_order}`,
              })
            : formatMessage(MESSAGES.workflowChangeMapping, {
                  source: impact.mapping_source ?? '',
                  target: impact.mapping_target ?? '',
              });

    return (
        <>
            {removedQuestions.length > 0 && (
                <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom color="error">
                        {formatMessage(MESSAGES.removedQuestionsSection, {
                            count: `${removedQuestions.length}`,
                        })}
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionName)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionLabel)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionType)}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {removedQuestions.map(q => (
                                <TableRow key={q.name}>
                                    <TableCell>{q.name}</TableCell>
                                    <TableCell>{q.label}</TableCell>
                                    <TableCell>{q.type}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
            {modifiedQuestions.length > 0 && (
                <Box>
                    <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="warning.main"
                    >
                        {formatMessage(MESSAGES.modifiedQuestionsSection, {
                            count: `${modifiedQuestions.length}`,
                        })}
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionName)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionLabel)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionOldType)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.questionNewType)}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modifiedQuestions.map(q => (
                                <TableRow key={q.name}>
                                    <TableCell>{q.name}</TableCell>
                                    <TableCell>{q.label}</TableCell>
                                    <TableCell>{q.old_type}</TableCell>
                                    <TableCell>{q.new_type}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
            {workflowImpacts.length > 0 && (
                <Box mt={2}>
                    <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="warning.main"
                    >
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
                                    <TableCell>
                                        {impact.entity_type_name}
                                    </TableCell>
                                    <TableCell>
                                        {`${impact.workflow_version_name} (${impact.workflow_version_status})`}
                                    </TableCell>
                                    <TableCell>{usage(impact)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </>
    );
};

export default FormVersionsDiffTables;
