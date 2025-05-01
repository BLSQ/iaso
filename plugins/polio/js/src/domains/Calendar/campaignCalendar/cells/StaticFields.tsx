import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';
import classnames from 'classnames';

import { useStaticFields } from '../../hooks/useStaticFields';
import { colSpanTitle } from '../constants';
import { useStyles } from '../Styles';
import { MappedCampaign } from '../types';

type Props = {
    campaign: MappedCampaign;
    isPdf: boolean;
    subActivitiesExpanded: boolean;
    setSubActivitiesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StaticFieldsCells: FunctionComponent<Props> = ({
    campaign,
    isPdf,
    subActivitiesExpanded,
    setSubActivitiesExpanded,
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
                        {field.render &&
                            field.render(
                                campaign,
                                subActivitiesExpanded,
                                setSubActivitiesExpanded,
                                campaign.subActivities.length > 0,
                            )}
                    </Box>
                </TableCell>
            ))}
        </>
    );
};
