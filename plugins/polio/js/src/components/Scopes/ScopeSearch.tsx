import React, { FunctionComponent, useState, useEffect } from 'react';
import { Grid, Button, Box } from '@material-ui/core';
import FiltersIcon from '@material-ui/icons/FilterList';
import { FormattedMessage } from 'react-intl';

// @ts-ignore
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../../constants/messages';

type Props = {
    // eslint-disable-next-line no-unused-vars
    onSearch: (newsearch: string) => void;
    search: string;
    // eslint-disable-next-line no-unused-vars
    setSearch: (newSearch: string) => void;
};
export const ScopeSearch: FunctionComponent<Props> = ({
    onSearch,
    search,
    setSearch,
}) => {
    const [searchUpdated, setSearchUpdated] = useState(false);
    useEffect(() => {
        setSearchUpdated(true);
    }, [search]);
    return (
        <Grid container spacing={3} item xs={12} md={5}>
            <Grid xs={12} md={6} item>
                <InputComponent
                    variant="contained"
                    keyValue="search"
                    type="search"
                    onEnterPressed={() => onSearch(search)}
                    withMarginTop={false}
                    label={MESSAGES.search}
                    onChange={(key, value) => {
                        setSearch(value);
                    }}
                    value={search}
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Button
                    style={{ marginLeft: 'auto' }}
                    variant="contained"
                    disabled={!searchUpdated}
                    color="primary"
                    onClick={() => onSearch(search)}
                >
                    <Box mr={1} top={3} position="relative">
                        <FiltersIcon />
                    </Box>
                    <FormattedMessage {...MESSAGES.filter} />
                </Button>
            </Grid>
        </Grid>
    );
};
