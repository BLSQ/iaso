import { Field } from 'formik';
import React, { FunctionComponent } from 'react';
import { OrgUnit } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { CampaignFormValues } from '../../../constants/types';
import { PolioVaccine } from '../../../constants/virus';
import { ScopeInput } from './ScopeInput';
import { ScopeSearch } from './Scopes/ScopeSearch';
import { FilteredDistricts } from './Scopes/types';

type Props = {
    name: string;
    search: string;
    filteredDistricts?: FilteredDistricts[];
    searchScope: boolean;
    setSearchScope: (newSearchScope: boolean) => void;
    isFetchingDistricts: boolean;
    isFetchingRegions: boolean;
    regionShapes?: OrgUnit[];
    districtShapes?: OrgUnit[];
    setSearch: (newSearch: string) => void;
    page: number;
    setPage: (page: number) => void;
    campaign: CampaignFormValues; // See ScopeField props for explanation
    availableVaccines?: PolioVaccine[];
    searchInputWithMargin?: boolean;
};

export const ScopeField: FunctionComponent<Props> = ({
    name,
    search,
    filteredDistricts,
    searchScope,
    setSearchScope,
    isFetchingDistricts,
    isFetchingRegions,
    regionShapes,
    districtShapes,
    setSearch,
    page,
    setPage,
    campaign,
    availableVaccines,
    searchInputWithMargin = true,
}) => (
    <Field
        name={name}
        component={ScopeInput}
        filteredDistricts={filteredDistricts}
        searchScope={searchScope}
        onChangeSearchScope={() => setSearchScope(!searchScope)}
        isFetchingDistricts={isFetchingDistricts || !filteredDistricts}
        isFetchingRegions={isFetchingRegions || !regionShapes}
        districtShapes={districtShapes}
        regionShapes={regionShapes}
        searchComponent={<ScopeSearch search={search} setSearch={setSearch} />}
        page={page}
        setPage={setPage}
        campaign={campaign}
        availableVaccines={availableVaccines}
        searchInputWithMargin={searchInputWithMargin}
    />
);
