import React, {
    useState,
    FunctionComponent,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import { useDispatch } from 'react-redux';

import { Grid, Button, makeStyles, Box } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

// @ts-ignore
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from '../../../components/forms/InputComponent';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';

import { baseUrl } from '../config';

import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams';
import {
    useGetBeneficiariesApiParams,
    useGetBeneficiaryTypesDropdown,
    useGetUsersDropDown,
} from '../hooks/requests';
import { useFiltersParams } from '../hooks/useFiltersParams';

import { Params, Filters as FilterType } from '../types/filters';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import { useCurrentUser } from '../../../utils/usersUtils';
import {
    SHOW_BENEFICIARY_TYPES_IN_LIST_MENU,
    hasFeatureFlag,
} from '../../../utils/featureFlags';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: Params;
    isFetching: boolean;
};

const Filters: FunctionComponent<Props> = ({ params, isFetching }) => {
    const getParams = useFiltersParams();
    const currentUser = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState<FilterType>({
        search: params.search,
        location: params.location,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        submitterId: params.submitterId,
        submitterTeamId: params.submitterTeamId,
        entityTypeIds: params.entityTypeIds,
    });

    useEffect(() => {
        setFilters({
            search: params.search,
            location: params.location,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            submitterId: params.submitterId,
            submitterTeamId: params.submitterTeamId,
            entityTypeIds: params.entityTypeIds,
        });
    }, [params]);
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.location);
    const [textSearchError, setTextSearchError] = useState<boolean>(false);

    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const { data: types, isFetching: isFetchingTypes } =
        useGetBeneficiaryTypesDropdown();
    const { data: teamOptions } = useGetTeamsDropdown({});
    const selectedTeam = useMemo(() => {
        return teamOptions?.find(
            option => option.value === filters.submitterTeamId,
        )?.original;
    }, [filters.submitterTeamId, teamOptions]);

    const { data: usersOptions } = useGetUsersDropDown(selectedTeam);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: Params = getParams(params, filters);
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, getParams, params, filters, dispatch]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            if (key === 'location') {
                setInitialOrgUnitId(value);
            }
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );
    const handleTeamChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [key]: value,
                submitterId: undefined,
            });
        },
        [filters],
    );

    const { url: apiUrl } = useGetBeneficiariesApiParams(params);
    return (
        <Box mb={1}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        blockForbiddenChars
                        onErrorChange={setTextSearchError}
                    />
                    {!hasFeatureFlag(
                        currentUser,
                        SHOW_BENEFICIARY_TYPES_IN_LIST_MENU,
                    ) && (
                        <InputComponent
                            keyValue="entityTypeIds"
                            onChange={handleChange}
                            value={filters.entityTypeIds}
                            type="select"
                            loading={isFetchingTypes}
                            label={MESSAGES.types}
                            options={types}
                            multi
                        />
                    )}

                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.location}
                            onConfirm={orgUnit =>
                                handleChange(
                                    'location',
                                    orgUnit ? [orgUnit.id] : undefined,
                                )
                            }
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        onChangeDate={handleChange}
                        labelFrom={MESSAGES.dateFrom}
                        labelTo={MESSAGES.dateTo}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="submitterTeamId"
                        onChange={handleTeamChange}
                        value={filters.submitterTeamId}
                        type="select"
                        label={MESSAGES.submitterTeam}
                        options={teamOptions}
                    />
                    <InputComponent
                        keyValue="submitterId"
                        onChange={handleChange}
                        value={filters.submitterId}
                        type="select"
                        label={MESSAGES.submitter}
                        options={usersOptions}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        mt={2}
                        display="flex"
                        justifyContent="flex-end"
                        alignItems="end"
                        flexDirection="column"
                    >
                        <Box mb={2}>
                            <Button
                                data-test="search-button"
                                disabled={textSearchError || !filtersUpdated}
                                variant="contained"
                                color="primary"
                                onClick={() => handleSearch()}
                            >
                                <SearchIcon className={classes.buttonIcon} />
                                {formatMessage(MESSAGES.search)}
                            </Button>
                        </Box>
                        <DownloadButtonsComponent
                            csvUrl={`${apiUrl}&csv=true`}
                            xlsxUrl={`${apiUrl}&xlsx=true`}
                            disabled={isFetching}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export { Filters };
