/* eslint-disable react/jsx-props-no-spreading */
import React, {
    FunctionComponent,
    useState,
    useCallback,
    useEffect,
} from 'react';
import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';
import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import MESSAGES from '../../constants/messages';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useRouter } from '../../../../../../hat/assets/js/apps/Iaso/routing/useRouter';

type Props = {
    router: any;
    disableOnlyDeleted: boolean;
};

export const GroupedCampaignsFilter: FunctionComponent<Props> = ({
    router,
    // TODO set to false shwoOnlyDeleted is implemented
    disableOnlyDeleted = true,
}) => {
    const { params } = useRouter();
    const [filtersUpdated, setFiltersUpdated] = useState<boolean>(false);
    // const [countries, setCountries] = useState<string>(params.countries);
    const [search, setSearch] = useState<string>(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showOnlyDeleted === 'true',
    );
    const [textSearchError, setTextSearchError] = useState(false);
    const dispatch = useDispatch();
    // const { data, isFetching: isFetchingCountries } = useGetCountries();
    // const countriesList = data?.orgUnits ?? [];

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                // countries,
                search: search && search !== '' ? search : undefined,
                showOnlyDeleted: showOnlyDeleted || undefined,
            };
            const url = genUrl(router, urlParams);
            dispatch(replace(url));
        }
    }, [dispatch, filtersUpdated, router, search, showOnlyDeleted]);

    useEffect(() => {
        setFiltersUpdated(true);
    }, [search, showOnlyDeleted]);

    return (
        <>
            <Box display="inline-flex" width="85%">
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <InputComponent
                            keyValue="search"
                            onChange={(key, value) => {
                                setSearch(value);
                            }}
                            value={search}
                            type="search"
                            label={MESSAGES.search}
                            onEnterPressed={handleSearch}
                            blockForbiddenChars
                            onErrorChange={setTextSearchError}
                        />
                        {!disableOnlyDeleted && (
                            <InputComponent
                                keyValue="showOnlyDeleted"
                                onChange={(key, value) => {
                                    setShowOnlyDeleted(value);
                                }}
                                value={showOnlyDeleted}
                                type="checkbox"
                                label={MESSAGES.showOnlyDeleted}
                            />
                        )}
                    </Grid>
                    {/* TODO uncomment when filter ready in backend */}
                    {/* <Grid item xs={3}>
                        <InputComponent
                            loading={isFetchingCountries}
                            keyValue="countries"
                            multi
                            clearable
                            onChange={(key, value) => {
                                setCountries(value);
                            }}
                            value={countries}
                            type="select"
                            options={countriesList.map(c => ({
                                label: c.name,
                                value: c.id,
                            }))}
                            label={MESSAGES.country}
                        />
                    </Grid> */}
                </Grid>
            </Box>
            <Box display="inline-flex" width="15%" justifyContent="flex-end">
                <Box position="relative" top={16}>
                    <Button
                        disabled={textSearchError || !filtersUpdated}
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                    >
                        <Box mr={1} top={3} position="relative">
                            <FiltersIcon />
                        </Box>
                        <FormattedMessage {...MESSAGES.filter} />
                    </Button>
                </Box>
            </Box>
        </>
    );
};
