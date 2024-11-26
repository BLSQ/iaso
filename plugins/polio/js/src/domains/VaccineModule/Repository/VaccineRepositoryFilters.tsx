import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid } from '@mui/material';
import { useRedirectToReplace } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { FormattedMessage } from 'react-intl';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetGroupDropdown } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import MESSAGES from '../../../constants/messages';
import { useGetCountries } from '../../../hooks/useGetCountries';

import { appId } from '../../../constants/app';
import { useGetFileTypes } from './hooks/useGetFileTypes';
import { VaccineRepositoryParams } from './types';
import { defaultVaccineOptions } from '../SupplyChain/constants';

type Props = {
    params: VaccineRepositoryParams;
    disableDates?: boolean;
    isEmbedded?: boolean;
    redirectUrl: string;
};

export const VaccineRepositoryFilters: FunctionComponent<Props> = ({
    params,
    isEmbedded = false,
    redirectUrl,
}) => {
    const redirectToReplace = useRedirectToReplace();

    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [vaccineType, setVaccineType] = useState(params.vaccine_type);
    const [fileType, setFileType] = useState(
        params.file_type || 'VRF,PRE_ALERT,FORM_A',
    );
    const [countryBlocks, setCountryBlocks] = useState(params.country_block);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                ...params,
                countries,
                page: undefined,
                country_block: countryBlocks,
                vaccine_type: vaccineType,
                file_type: fileType,
            };
            redirectToReplace(redirectUrl, urlParams);
        }
    }, [
        filtersUpdated,
        params,
        countries,
        countryBlocks,
        vaccineType,
        fileType,
        redirectToReplace,
        redirectUrl,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    // Pass the appId to have it works in the embedded vaccine stock where the user is not connected
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True', appId });

    const countriesList = (data && data.orgUnits) || [];

    const fileTypes = useGetFileTypes();
    useEffect(() => {
        setFiltersUpdated(true);
    }, [countries, countryBlocks, fileType, vaccineType]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="countries"
                        multi
                        clearable
                        onChange={(_, value) => {
                            setCountries(value);
                        }}
                        value={countries}
                        type="select"
                        options={countriesList.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        label={MESSAGES.countries}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        loading={isFetchingGroupedOrgUnits}
                        keyValue="country_block"
                        multi
                        clearable
                        onChange={(key, value) => {
                            setCountryBlocks(value);
                        }}
                        value={countryBlocks}
                        type="select"
                        options={groupedOrgUnits}
                        label={MESSAGES.countryBlock}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="vaccine_type"
                        multi
                        clearable
                        onChange={(key, value) => {
                            setVaccineType(value);
                        }}
                        value={vaccineType}
                        type="select"
                        options={defaultVaccineOptions}
                        label={MESSAGES.vaccine}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="file_type"
                        clearable
                        onChange={(_key, value) => {
                            setFileType(value);
                        }}
                        value={fileType}
                        type="select"
                        options={fileTypes}
                        label={MESSAGES.fileType}
                    />
                </Grid>
            </Grid>

            <Grid container item xs={12} justifyContent="flex-end">
                <Box mt={2}>
                    <Button
                        disabled={!filtersUpdated}
                        variant="contained"
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <Box mr={1} top={3} position="relative">
                            <FiltersIcon />
                        </Box>
                        <FormattedMessage {...MESSAGES.filter} />
                    </Button>
                </Box>
            </Grid>
        </>
    );
};
