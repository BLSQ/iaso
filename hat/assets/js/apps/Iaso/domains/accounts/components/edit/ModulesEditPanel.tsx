import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayCheckboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';

//todo: modules props
export const ModulesEditPanel = ({ modules }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.modulesTitle)}
            expandable={true}
            id={'edit-modules'}
        >
            <Table>
                <TableBody>
                    {modules?.map(({ value, label }) => {
                        return (
                            <TableRow key={value}>
                                <TableCell>{label}</TableCell>
                                <TableCell>
                                    <Field
                                        component={ArrayCheckboxInput}
                                        name={'modules'}
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
