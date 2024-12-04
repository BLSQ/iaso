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
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import MESSAGES from '../../../../constants/messages';
import { useGetCountries } from '../../../../hooks/useGetCountries';

import { appId } from '../../../../constants/app';
import { defaultVaccineOptions } from '../../SupplyChain/constants';
import { useGetReportFileTypes } from '../hooks/useGetFileTypes';
import { ReportParams } from '../types';

type Props = {
    params: ReportParams;
    disableDates?: boolean;
    isEmbedded?: boolean;
    redirectUrl: string;
};

export const Filters: FunctionComponent<Props> = ({ params, redirectUrl }) => {
    const redirectToReplace = useRedirectToReplace();

    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.reportCountries);
    const [fileType, setFileType] = useState(params.reportFileType || 'IR,DR');
    const [vaccineType, setVaccineType] = useState(params.reportVaccineType);
    const [countryBlocks, setCountryBlocks] = useState(
        params.reportCountryBlock,
    );

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                ...params,
                reportCountries: countries,
                page: undefined,
                reportCountryBlock: countryBlocks,
                reportFileType: fileType,
                reportVaccineType: vaccineType,
            };
            redirectToReplace(redirectUrl, urlParams);
        }
    }, [
        filtersUpdated,
        params,
        countries,
        countryBlocks,
        fileType,
        redirectToReplace,
        redirectUrl,
        vaccineType,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    // Pass the appId to have it works in the embedded vaccine stock where the user is not connected
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True', appId });

    const countriesList = (data && data.orgUnits) || [];

    const fileTypes = useGetReportFileTypes();
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
                        loading={isFetchingGroupedOrgUnits}
                        keyValue="reportCountryBlock"
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
                        loading={isFetchingCountries}
                        keyValue="reportCountries"
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
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="reportFileType"
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
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="reportVaccineType"
                        clearable
                        onChange={(_key, value) => {
                            setVaccineType(value);
                        }}
                        value={vaccineType}
                        type="select"
                        options={defaultVaccineOptions}
                        label={MESSAGES.vaccine}
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
