import classnames from 'classnames';
import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';

import { useStaticFields } from '../../hooks/useStaticFields';
import { useStyles } from '../Styles';
import { colSpanTitle } from '../constants';
import { MappedCampaign } from '../types';

type Props = {
    campaign: MappedCampaign;
    isPdf: boolean;
};

export const StaticFieldsCells: FunctionComponent<Props> = ({
    campaign,
    isPdf,
}) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const fields = useStaticFields(isPdf);
    return (
        <>
            {fields.map(field => (
                <TableCell
                    key={field.key}
                    colSpan={colSpanTitle}
                    className={classnames(defaultCellStyles)}
                >
                    <Box
                        className={classnames(
                            classes.tableCellSpan,
                            classes.tableCellSpanRow,
                        )}
                        sx={{ px: field.key === 'edit' ? 0 : 1 }}
                    >
                        {!field.render && campaign[field.key]}
                        {field.render && field.render(campaign)}
                    </Box>
                </TableCell>
            ))}
        </>
    );
};
