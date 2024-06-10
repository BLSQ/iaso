/* eslint-disable react/require-default-props */
import { Box, Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import { Field } from '../types/fields';
import { PaperTableRow } from '../../../components/tables/PaperTableRow';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    dynamicFields: Field[];
    staticFields: Field[];
};

export const BeneficiaryBaseInfoContents: FunctionComponent<Props> = ({
    dynamicFields,
    staticFields,
}) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Box className={classes.infoPaperBox}>
            <Table size="small">
                <TableBody>
                    {dynamicFields.map(field => (
                        <PaperTableRow
                            label={field.label}
                            value={field.value}
                            key={field.key}
                        />
                    ))}
                    {staticFields.map(field => (
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
