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
    Alert,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

type ValidationErrorRow = {
    row: number;
    errors: Record<string, string>;
};

type ValidationErrorGeneral = {
    general: string;
};

type ValidationErrorTableProps = {
    errors: Array<ValidationErrorGeneral | ValidationErrorRow>;
};

const isValidationErrorRow = (
    error: ValidationErrorGeneral | ValidationErrorRow,
): error is ValidationErrorRow => {
    return !('general' in error);
};

const isValidationErrorGeneral = (
    error: ValidationErrorGeneral | ValidationErrorRow,
): error is ValidationErrorGeneral => {
    return 'general' in error;
};

export const ValidationErrorTable = ({ errors }: ValidationErrorTableProps) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            {errors
                ?.filter(error => isValidationErrorGeneral(error))
                ?.map(error => {
                    return (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            key={`general-error-alert`}
                        >
                            {error?.general}
                        </Alert>
                    );
                })}
            {errors?.some(err => !('general' in err)) && (
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
                            {errors
                                .filter(error => isValidationErrorRow(error))
                                .flatMap(error =>
                                    Object.entries(error.errors).map(
                                        ([field, message], idx) => (
                                            <TableRow
                                                key={`${error.row}-${field}`}
                                            >
                                                {idx === 0 && (
                                                    <TableCell
                                                        rowSpan={
                                                            Object.keys(
                                                                error.errors,
                                                            ).length
                                                        }
                                                        sx={{
                                                            verticalAlign:
                                                                'top',
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
            )}
        </>
    );
};
