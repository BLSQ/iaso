import React from 'react';
import { Alert, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ErrorMessage, Field } from 'formik';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayCheckboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';

type Props = {
    accountFeatureFlags?: ApiAccountFeatureFlagsDropdownListQueryResult;
};

export const FeatureFlagsEditPanel = ({ accountFeatureFlags }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.featureFlagsTitle)}
            expandable={true}
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
                    <Table>
                        <TableBody>
                            {accountFeatureFlags?.map(({ value, label }) => {
                                return (
                                    <TableRow key={value}>
                                        <TableCell>{label}</TableCell>
                                        <TableCell>
                                            <Field
                                                component={ArrayCheckboxInput}
                                                name={'feature_flags'}
                                                value={value}
                                                aria-label={label}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
