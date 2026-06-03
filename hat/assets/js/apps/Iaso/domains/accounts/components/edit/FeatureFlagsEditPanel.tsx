import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
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
