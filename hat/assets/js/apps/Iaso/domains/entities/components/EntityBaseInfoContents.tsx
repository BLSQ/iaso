/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import { Box, Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import { PaperTableRow } from '../../../components/tables/PaperTableRow';
import { Field } from '../types/fields';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaperBox: {
        minHeight: '100px',
        // @ts-ignore
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
    },
}));

type Props = {
    fields: Field[];
};

export const EntityBaseInfoContents: FunctionComponent<Props> = ({
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
                            withoutPadding={field.type === 'geopoint'}
                        />
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
