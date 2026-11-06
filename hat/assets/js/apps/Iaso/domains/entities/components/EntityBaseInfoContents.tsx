import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
import { commonStyles } from 'bluesquare-components';
import { PaperTableRow } from '../../../components/tables/PaperTableRow';
import { Field } from '../types/fields';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaperBox: {
        minHeight: '100px',
        borderTop: `1px solid ${theme.palette.lightGray.border}`,
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
