import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
// @ts-ignore
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../../../../constants/messages';

type Props = {
    search: string;
    // eslint-disable-next-line no-unused-vars
    setSearch: (newSearch: string) => void;
};
export const ScopeSearch: FunctionComponent<Props> = ({
    search,
    setSearch,
}) => {
    return (
        <Grid container spacing={2} item xs={12} alignItems="center">
            <Grid xs={12} md={8} item>
                <InputComponent
                    variant="contained"
                    keyValue="search"
                    type="search"
                    withMarginTop={false}
                    label={MESSAGES.search}
                    onChange={(key, value) => {
                        setSearch(value);
                    }}
                    value={search}
                />
            </Grid>
        </Grid>
    );
};
