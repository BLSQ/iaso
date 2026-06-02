import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { Field } from 'formik';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayChecboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';

//todo: modules props
export const ModulesEditPanel = ({ modules }) => {
    return (
        <WidgetPaper title={'Modules'} expandable={true} id={'edit-modules'}>
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
