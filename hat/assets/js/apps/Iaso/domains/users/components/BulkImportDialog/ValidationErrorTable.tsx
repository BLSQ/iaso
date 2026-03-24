import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

interface ValidationError {
    row: number;
    errors: Record<string, string>;
}

interface ValidationErrorTableProps {
    errors: ValidationError[];
}

export const ValidationErrorTable: React.FC<ValidationErrorTableProps> = ({
    errors,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Typography variant="subtitle2">
                                {formatMessage(MESSAGES.row)}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="subtitle2">
                                {formatMessage(MESSAGES.field)}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="subtitle2">
                                {formatMessage(MESSAGES.errorMessage)}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {errors.flatMap(error =>
                        Object.entries(error.errors).map(
                            ([field, message], idx) => (
                                <TableRow key={`${error.row}-${field}`}>
                                    {idx === 0 && (
                                        <TableCell
                                            rowSpan={
                                                Object.keys(error.errors).length
                                            }
                                            sx={{
                                                verticalAlign: 'top',
                                                pt: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                            >
                                                {error.row}
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Chip
                                            label={field}
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {message}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ),
                        ),
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
