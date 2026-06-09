import React, { FunctionComponent } from 'react';
import { Alert, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ErrorMessage, Field } from 'formik';
import { ApiModulesDropdownListQueryResult } from 'Iaso/api/modules';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayCheckboxInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { getOverriddenTheme } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Props = {
    modules?: ApiModulesDropdownListQueryResult;
};

const styles: SxStyles = {
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

export const ModulesEditPanel: FunctionComponent<Props> = ({ modules }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.modulesTitle)}
            expandable={true}
            id={'edit-modules'}
        >
            {modules?.length ? (
                <>
                    <ErrorMessage name="modules">
                        {msg => (
                            <Alert severity={'error'} sx={{ mb: 2 }}>
                                {msg}
                            </Alert>
                        )}
                    </ErrorMessage>
                    <Table size={'small'}>
                        <TableBody>
                            {modules?.map(({ value, label }) => {
                                return (
                                    <TableRow key={value} sx={styles.row}>
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
                </>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
