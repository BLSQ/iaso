import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    filter: {
        defaultMessage: 'Filter',
        id: 'iaso.label.filter',
    },
});

type Props = {
    disabled: boolean;
    onFilter: () => void;
    size?: 'medium' | 'small' | 'large' | undefined;
};

export const FilterButton: FunctionComponent<Props> = ({
    disabled,
    onFilter,
    size = 'medium',
}) => {
    return (
        <Button
            data-test="search-button"
            disabled={disabled}
            variant="contained"
            color="primary"
            onClick={onFilter}
            size={size}
        >
            <Box mr={1} top={3} position="relative">
                <FiltersIcon />
            </Box>
            <FormattedMessage {...MESSAGES.filter} />
        </Button>
    );
};
