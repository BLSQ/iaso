import React, { FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import { NestedGroup } from '../types';
import { Box, TableCell } from '@mui/material';

type Props = {
    groups: NestedGroup[];
    isCellApproved: boolean;
    oldValues: NestedGroup[];
};
const useStyles = makeStyles(theme => ({
    existingValues: {
        color: `${theme.palette.primary.main} !important`,
    },
    added: {
        color: `${theme.palette.error.light} !important`,
    },
    approved: {
        color: `${theme.palette.success.light} !important`,
    },
}));

export const HighlightFields: FunctionComponent<Props> = ({
    groups,
    isCellApproved,
    oldValues
}) => {
    const classes = useStyles();
    const oldGroups = oldValues.map(value => value.name);

    return (
        <TableCell>
            {sortBy(groups, 'name').map((group, index) => {
                const { name } = group;
                const isAddedElement = !oldGroups.includes(name);
                const groupName = (index !== groups.length - 1  && `${name}, `) || name
                return (
                    <Box
                        component="span"
                        className={classNames(
                            isCellApproved && classes.approved,
                            isAddedElement && classes.added,
                            classes.existingValues,
                        )}
                    >
                        {groupName}
                    </Box>
                );
            })}
        </TableCell>
    );
};
