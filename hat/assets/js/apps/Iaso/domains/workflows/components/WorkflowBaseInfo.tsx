/* eslint-disable react/require-default-props */
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

import { WorkflowDetail } from '../types/workflows';

import { StatusCell } from './StatusCell';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

type RowProps = {
    label: string;
    value?: string;
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
    workflow?: WorkflowDetail;
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
                        value={workflow?.reference_form.name}
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
