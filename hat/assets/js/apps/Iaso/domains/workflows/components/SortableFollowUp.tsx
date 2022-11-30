import React, { FunctionComponent } from 'react';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import { TableCell, IconButton, Box } from '@material-ui/core';

import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';

import { FollowUps } from '../types/workflows';

type Props = {
    item: FollowUps;
    index: number;
    handleProps?: any;
};

export const SortableFollowUp: FunctionComponent<Props> = ({
    item,
    index,
    handleProps,
}) => {
    if (!item) return null;
    const { forms, created_at: createdAt, updated_at: updatedAt } = item;
    return (
        <>
            <TableCell width={10}>
                <IconButton
                    data-sortable-index={index}
                    component="span"
                    disableRipple
                    {...handleProps}
                >
                    <DragIndicatorIcon />
                </IconButton>
            </TableCell>
            <TableCell>
                {forms.map((form, ind) => (
                    <Box key={form.id}>
                        <LinkToForm formId={form.id} formName={form.name} />
                        {ind + 1 < forms.length ? ', ' : ''}
                    </Box>
                ))}
            </TableCell>
            <TableCell>{DateCell({ value: createdAt })}</TableCell>
            <TableCell>{DateCell({ value: updatedAt })}</TableCell>
        </>
    );
};
