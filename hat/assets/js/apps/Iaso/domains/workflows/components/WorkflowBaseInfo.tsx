/* eslint-disable react/require-default-props */
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import React, { FunctionComponent, ReactNode } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

import { WorkflowVersionDetail } from '../types/workflows';

import { StatusCell } from './StatusCell';
import { LinkToForm } from '../../forms/components/LinkToForm';

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
    workflow?: WorkflowVersionDetail;
};
export const WorkflowBaseInfo: FunctionComponent<Props> = ({ workflow }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Table size="small">
                <TableBody>
                    <Row
                        label={formatMessage(MESSAGES.name)}
                        value={workflow?.name}
                    />
                    <Row
                        label={formatMessage(MESSAGES.type)}
                        value={workflow?.entity_type.name}
                    />
                    <Row
                        label={formatMessage(MESSAGES.referenceForm)}
                        value={
                            workflow ? (
                                <LinkToForm
                                    formId={workflow.reference_form.id}
                                    formName={workflow.reference_form.name}
                                />
                            ) : (
                                ''
                            )
                        }
                    />
                    <Row
                        label={formatMessage(MESSAGES.version)}
                        value={workflow?.version_id}
                    />
                    <Row
                        label={formatMessage(MESSAGES.status)}
                        value={
                            workflow ? (
                                <StatusCell status={workflow.status} />
                            ) : (
                                ''
                            )
                        }
                    />
                </TableBody>
            </Table>
        </>
    );
};
