import React, { FunctionComponent, useState, useEffect } from 'react';
import { Grid, Button, Box } from '@material-ui/core';
import FiltersIcon from '@material-ui/icons/FilterList';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

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
    const { formatMessage } = useSafeIntl();
    const [searchUpdated, setSearchUpdated] = useState(false);
    useEffect(() => {
        setSearchUpdated(true);
    }, [search]);
    return (
        <Grid container spacing={2} item xs={12} alignItems="center">
            <Grid xs={12} md={8} item>
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
            <Grid container xs={12} md={4} item justifyContent="flex-end">
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
                    {formatMessage(MESSAGES.filter)}
                </Button>
            </Grid>
        </Grid>
    );
};
