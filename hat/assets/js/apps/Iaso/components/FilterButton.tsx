/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import FiltersIcon from '@material-ui/icons/FilterList';
import { Button, Box } from '@material-ui/core';
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
};

export const FilterButton: FunctionComponent<Props> = ({
    disabled,
    onFilter,
}) => {
    return (
        <Button
            data-test="search-button"
            disabled={disabled}
            variant="contained"
            color="primary"
            onClick={onFilter}
        >
            <Box mr={1} top={3} position="relative">
                <FiltersIcon />
            </Box>
            <FormattedMessage {...MESSAGES.filter} />
        </Button>
    );
};
