import React, { FunctionComponent } from 'react';
import Alert from '@mui/material/Alert/Alert';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableContainer from '@mui/material/TableContainer/TableContainer';
import TableRow from '@mui/material/TableRow/TableRow';
import { useSafeIntl } from 'bluesquare-components';
import { ErrorMessage, Field, useFormikContext } from 'formik';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags';
import { ApiAccountsUpdateBody } from 'Iaso/api/accounts/models/apiAccountsUpdateBody.zod';
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
        maxHeight: 'calc(87vh - 500px)',
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
    const form = useFormikContext<ApiAccountsUpdateBody>();

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
                <TableContainer sx={styles.tableContainer}>
                    <Table size={'small'} stickyHeader>
                        <TableBody>
                            {form.values.feature_flags?.map(value => {
                                return (
                                    <TableRow key={value} sx={styles.row}>
                                        <TableCell>{value}</TableCell>
                                        <TableCell>
                                            <Field
                                                component={ArrayCheckboxInput}
                                                name={'feature_flags'}
                                                value={value}
                                                checked
                                                disabled
                                                aria-label={value}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </WidgetPaper>
    );
};
