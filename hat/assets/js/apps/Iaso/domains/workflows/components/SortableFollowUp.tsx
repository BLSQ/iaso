import React, { FunctionComponent } from 'react';
import { TableCell, Box } from '@material-ui/core';

import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';

import { FollowUps } from '../types/workflows';

type Props = {
    item: FollowUps;
};

export const SortableFollowUp: FunctionComponent<Props> = ({ item }) => {
    if (!item) return null;
    const {
        forms,
        created_at: createdAt,
        updated_at: updatedAt,
        condition,
    } = item;
    return (
        <>
            <TableCell align="center">{condition}</TableCell>
            <TableCell align="center">
                {forms.map((form, ind) => (
                    <Box key={form.id}>
                        <LinkToForm formId={form.id} formName={form.name} />
                        {ind + 1 < forms.length ? ', ' : ''}
                    </Box>
                ))}
            </TableCell>
            <TableCell align="center">
                {DateCell({ value: createdAt })}
            </TableCell>
            <TableCell align="center">
                {DateCell({ value: updatedAt })}
            </TableCell>
            <TableCell align="center" />
        </>
    );
};
