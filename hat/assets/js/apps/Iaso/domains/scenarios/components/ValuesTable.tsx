import React, { FunctionComponent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import {
    IntlMessage,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    title: { mt: 2, fontWeight: 'bold' },
    code: { fontFamily: 'monospace', wordBreak: 'break-all' },
};

type Props = {
    title: IntlMessage;
    values?: Record<string, unknown>;
};

const display = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
        return textPlaceholder;
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
};

/** Question name -> value, as the technical people need it. */
export const ValuesTable: FunctionComponent<Props> = ({ title, values }) => {
    const { formatMessage } = useSafeIntl();
    if (!values || Object.keys(values).length === 0) {
        return null;
    }
    return (
        <>
            <Typography variant="subtitle2" sx={styles.title}>
                {formatMessage(title)}
            </Typography>
            <Table size="small">
                <TableBody>
                    {Object.entries(values).map(([name, value]) => (
                        <TableRow key={name}>
                            <TableCell sx={styles.code}>{name}</TableCell>
                            <TableCell sx={styles.code}>
                                {display(value)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};
