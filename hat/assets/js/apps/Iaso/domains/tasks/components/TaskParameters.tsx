import React, { FC } from 'react';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableRow from '@mui/material/TableRow/TableRow';
import { useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles: SxStyles = {
    table: {
        tableLayout: 'fixed',
    },
};

export type TaskParams = {
    label: string;
    value: any;
};

type Props = {
    taskParams: TaskParams[];
};

export const TaskParameters: FC<Props> = ({ taskParams }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper title={formatMessage(MESSAGES.params)}>
            <Table size={'small'} data-test="task-base-info" sx={styles.table}>
                <TableBody>
                    {taskParams.map(p => (
                        <TableRow key={p.label}>
                            <TableCell>{p.label}</TableCell>
                            <TableCell>{p.value}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
