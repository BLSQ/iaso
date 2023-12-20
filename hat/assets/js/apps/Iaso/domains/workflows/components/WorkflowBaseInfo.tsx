import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    Box,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, ReactNode } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

import { WorkflowVersionDetail } from '../types';

import { StatusCell } from './StatusCell';
import { DetailsForm } from './DetailsForm';
import { LinkToForm } from '../../forms/components/LinkToForm';

import { PublishVersionModal } from './versions/PublishVersionModal';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

type RowProps = {
    label: string;
    value?: string | ReactNode;
};

const Row: FunctionComponent<RowProps> = ({ label, value }) => {
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

type Props = {
    workflowVersion: WorkflowVersionDetail;
};
export const WorkflowBaseInfo: FunctionComponent<Props> = ({
    workflowVersion,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <DetailsForm workflowVersion={workflowVersion} />
            <Divider />
            <Table size="small" data-test="workflow-base-info">
                <TableBody>
                    <Row
                        label={formatMessage(MESSAGES.type)}
                        value={workflowVersion?.entity_type.name}
                    />
                    <Row
                        label={formatMessage(MESSAGES.referenceForm)}
                        value={
                            workflowVersion ? (
                                <LinkToForm
                                    formId={workflowVersion.reference_form.id}
                                    formName={
                                        workflowVersion.reference_form.name
                                    }
                                />
                            ) : (
                                ''
                            )
                        }
                    />
                    <Row
                        label={formatMessage(MESSAGES.version)}
                        value={workflowVersion?.version_id}
                    />
                    <Row
                        label={formatMessage(MESSAGES.status)}
                        value={
                            workflowVersion ? (
                                <StatusCell status={workflowVersion.status} />
                            ) : (
                                ''
                            )
                        }
                    />
                </TableBody>
            </Table>
            {workflowVersion?.status === 'DRAFT' && (
                <>
                    <Divider />
                    <Box p={2} display="flex" justifyContent="flex-end">
                        <PublishVersionModal
                            workflowVersion={workflowVersion}
                            invalidateQueryKey="workflowVersion"
                            iconProps={{
                                dataTestId: 'publish-workflow-button',
                            }}
                        />
                    </Box>
                </>
            )}
        </>
    );
};
