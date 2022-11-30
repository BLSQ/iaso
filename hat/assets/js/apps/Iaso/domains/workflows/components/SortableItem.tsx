import React, { FunctionComponent } from 'react';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import { Box, IconButton } from '@material-ui/core';

type Props = {
    item: any;
    index: number;
    handleProps: any;
};

export const SortableItem: FunctionComponent<Props> = ({
    item,
    index,
    handleProps,
}) => {
    return (
        <Box data-sortable-index={index} display="flex" alignItems="center">
            <IconButton component="span" disableRipple {...handleProps}>
                <DragIndicatorIcon />
            </IconButton>
            <span>{item.id}</span>
            <span>- order{item.order}</span>
        </Box>
    );
};
