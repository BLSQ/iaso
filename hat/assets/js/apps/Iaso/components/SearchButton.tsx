import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import SearchIcon from '@mui/icons-material/Search';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const MESSAGES = defineMessages({
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
});

type Props = {
    disabled: boolean;
    onSearch: () => void;
};

export const SearchButton: FunctionComponent<Props> = ({
    disabled,
    onSearch,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Button
            data-test="search-button"
            disabled={disabled}
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={onSearch}
        >
            <SearchIcon className={classes.buttonIcon} />
            {formatMessage(MESSAGES.search)}
        </Button>
    );
};
