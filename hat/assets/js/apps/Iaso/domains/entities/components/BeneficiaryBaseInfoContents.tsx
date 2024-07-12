/* eslint-disable react/require-default-props */
import { Box, Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent } from 'react';
import { commonStyles } from 'bluesquare-components';
import { Field } from '../types/fields';
import { PaperTableRow } from '../../../components/tables/PaperTableRow';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    fields: Field[];
};

export const BeneficiaryBaseInfoContents: FunctionComponent<Props> = ({
    fields,
}) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Box className={classes.infoPaperBox}>
            <Table size="small">
                <TableBody>
                    {fields.map(field => (
                        <PaperTableRow
                            label={field.label}
                            value={field.value}
                            key={field.key}
                        />
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
