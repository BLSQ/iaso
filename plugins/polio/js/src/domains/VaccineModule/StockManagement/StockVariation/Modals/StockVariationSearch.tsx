import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Box, Grid } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { baseUrls } from '../../../../../constants/urls';
import MESSAGES from '../../messages';
import type {
    StockVariationPageKey,
    StockVariationParams,
    StockVariationSearchKey,
} from '../../types';

type Props = {
    params: StockVariationParams;
    searchKey: StockVariationSearchKey;
    pageKey: StockVariationPageKey;
};

export const StockVariationSearch: FunctionComponent<Props> = ({
    params,
    searchKey,
    pageKey,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const urlSearch = params[searchKey] ?? '';
    const [search, setSearch] = useState<string>(urlSearch);

    useEffect(() => {
        setSearch(urlSearch);
    }, [urlSearch]);

    const handleSearch = useCallback(() => {
        redirectTo(baseUrls.stockVariation, {
            ...params,
            [searchKey]: search || undefined,
            [pageKey]: '1',
        });
    }, [pageKey, params, redirectTo, search, searchKey]);

    const handleChange = useCallback((_keyValue: string, value: unknown) => {
        setSearch((value as string) ?? '');
    }, []);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
                <InputComponent
                    type="search"
                    clearable
                    keyValue={searchKey}
                    value={search}
                    onChange={handleChange}
                    labelString={formatMessage(MESSAGES.search)}
                    onEnterPressed={handleSearch}
                />
            </Grid>
            <Grid item xs={12} md={8}>
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                    height="100%"
                >
                    <SearchButton
                        disabled={search === urlSearch}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
