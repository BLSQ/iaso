import React, { FunctionComponent } from 'react';
import {
    Alert,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ErrorMessage, Field } from 'formik';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayCheckboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { getOverriddenTheme } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Props = {
    accountFeatureFlags?: ApiAccountFeatureFlagsDropdownListQueryResult;
};

const styles: SxStyles = {
    tableContainer: {
        maxHeight: '27.3vh',
        overscrollBehavior: 'none',
    },
    row: {
        '&:nth-of-type(odd)': (
            theme: ReturnType<typeof getOverriddenTheme>,
        ) => ({
            backgroundColor: theme.palette.gray.background,
        }),
        '&:nth-of-type(even)': {
            backgroundColor: 'transparent',
        },
    },
};

export const FeatureFlagsEditPanel: FunctionComponent<Props> = ({
    accountFeatureFlags,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.featureFlagsTitle)}
            id={'account-feature-flags'}
        >
            {accountFeatureFlags?.length ? (
                <>
                    <ErrorMessage name="feature_flags">
                        {msg => (
                            <Alert severity={'error'} sx={{ mb: 2 }}>
                                {msg}
                            </Alert>
                        )}
                    </ErrorMessage>

                    <TableContainer sx={styles.tableContainer}>
                        <Table size={'small'} stickyHeader>
                            <TableBody>
                                {accountFeatureFlags?.map(
                                    ({ value, label }) => {
                                        return (
                                            <TableRow
                                                key={value}
                                                sx={styles.row}
                                            >
                                                <TableCell>{label}</TableCell>
                                                <TableCell>
                                                    <Field
                                                        component={
                                                            ArrayCheckboxInput
                                                        }
                                                        name={'feature_flags'}
                                                        value={value}
                                                        aria-label={label}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    },
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
