import React, { FunctionComponent, ReactNode } from 'react';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import { TablePropsSizeOverrides } from '@mui/material/Table/Table';
import { makeStyles } from '@mui/styles';
import { OverridableStringUnion } from '@mui/types/esm';
import { useSafeIntl } from 'bluesquare-components';

import moment from 'moment';
import { StatusCell } from 'Iaso/domains/tasks/components/StatusCell';
import getDisplayName from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';

import { Task } from '../types';

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
    task: Task<any>;
    size?: OverridableStringUnion<'small' | 'medium', TablePropsSizeOverrides>;
};
export const TaskBaseInfo: FunctionComponent<Props> = ({ task, size }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Table size={size} data-test="task-base-info">
            <TableBody>
                <Row label={formatMessage(MESSAGES.name)} value={task.name} />
                <Row
                    label={formatMessage(MESSAGES.user)}
                    value={getDisplayName(task.launcher)}
                />
                <Row
                    label={formatMessage(MESSAGES.timeCreated)}
                    value={moment.unix(task.created_at).format('LTS')}
                />
                <Row
                    label={formatMessage(MESSAGES.timeStart)}
                    value={moment.unix(task.started_at).format('LTS')}
                />
                {task.ended_at && (
                    <Row
                        label={formatMessage(MESSAGES.timeEnd)}
                        value={moment.unix(task.ended_at).format('LTS')}
                    />
                )}
                <Row
                    label={formatMessage(MESSAGES.status)}
                    value={task ? <StatusCell task={task} /> : ''}
                />
            </TableBody>
        </Table>
    );
};
