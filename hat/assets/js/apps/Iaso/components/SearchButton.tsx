import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button/Button';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const MESSAGES = defineMessages({
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
});

type Props = Omit<
    ButtonProps,
    'onClick' | 'color' | 'variant' | 'className' | 'disabled'
> & {
    disabled: boolean;
    onSearch: () => void;
};

export const SearchButton = ({ disabled, onSearch, ...props }: Props) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Button
            data-testid="search-button"
            disabled={disabled}
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={onSearch}
            {...props}
        >
            <SearchIcon className={classes.buttonIcon} />
            {formatMessage(MESSAGES.search)}
        </Button>
    );
};
