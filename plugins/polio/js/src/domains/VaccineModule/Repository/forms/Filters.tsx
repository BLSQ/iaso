import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid } from '@mui/material';
import { useRedirectToReplace } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { appId } from '../../../../constants/app';
import MESSAGES from '../../../../constants/messages';
import { useGetCountries } from '../../../../hooks/useGetCountries';

import { singleVaccinesList } from '../../SupplyChain/constants';
import { useGetFileTypes } from '../hooks/useGetFileTypes';
import { VaccineRepositoryParams } from '../types';

type Props = {
    params: VaccineRepositoryParams;
    disableDates?: boolean;
    redirectUrl: string;
};

export const Filters: FunctionComponent<Props> = ({ params, redirectUrl }) => {
    const redirectToReplace = useRedirectToReplace();

    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [fileType, setFileType] = useState(
        params.file_type || 'VRF,PRE_ALERT,FORM_A',
    );
    const [vaccineName, setVaccineName] = useState(params.vaccine_name);
    const [countryBlocks, setCountryBlocks] = useState(params.country_block);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                ...params,
                countries,
                page: undefined,
                country_block: countryBlocks,
                file_type: fileType,
                vaccine_name: vaccineName,
            };
            redirectToReplace(redirectUrl, urlParams);
        }
    }, [
        filtersUpdated,
        params,
        countries,
        countryBlocks,
        vaccineName,
        fileType,
        redirectToReplace,
        redirectUrl,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    // Pass the appId to have it works in the embedded vaccine stock where the user is not connected
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'true', appId });

    const countriesList = (data && data.orgUnits) || [];

    const fileTypes = useGetFileTypes();
    useEffect(() => {
        setFiltersUpdated(true);
    }, [countries, countryBlocks, fileType, vaccineName]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);

    return (
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
                    label={MESSAGES.country}
                />
                <InputComponent
                    keyValue="vaccine_name"
                    clearable
                    onChange={(key, value) => {
                        setVaccineName(value);
                    }}
                    value={vaccineName}
                    type="select"
                    options={singleVaccinesList}
                    label={MESSAGES.vaccine}
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
                <InputComponent
                    keyValue="file_type"
                    onChange={(_key, value) => {
                        setFileType(value);
                    }}
                    clearable={false}
                    value={fileType}
                    type="select"
                    options={fileTypes}
                    label={MESSAGES.fileType}
                />
            </Grid>
            <Grid container item xs={12} md={6} justifyContent="flex-end">
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
        </Grid>
    );
};
