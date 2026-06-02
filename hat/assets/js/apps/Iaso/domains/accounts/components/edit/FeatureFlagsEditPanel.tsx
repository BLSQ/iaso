import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { Field } from 'formik';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayChecboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';

type Props = {
    accountFeatureFlags?: ApiAccountFeatureFlagsDropdownListQueryResult;
};

export const FeatureFlagsEditPanel = ({ accountFeatureFlags }: Props) => {
    return (
        <WidgetPaper
            title={'Feature flags'}
            expandable={true}
            id={'account-feature-flags'}
        >
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
        </WidgetPaper>
    );
};
