import React, { FunctionComponent } from 'react';
import { Field } from 'formik';
import { ScopeSearch } from '../Scopes/ScopeSearch';
import { ScopeInput } from './ScopeInput';
import { FilteredDistricts, Shape } from '../Scopes/types';

type Props = {
    name: string;
    search: string;
    filteredDistricts?: FilteredDistricts[];
    searchScope: boolean;
    // eslint-disable-next-line no-unused-vars
    setSearchScope: (newSearchScope: boolean) => void;
    isFetchingDistricts: boolean;
    isFetchingRegions: boolean;
    regionShapes?: Shape[];
    districtShapes?: FilteredDistricts[];
    // eslint-disable-next-line no-unused-vars
    setSearch: (newSearch: string) => void;
    page: number;
    // eslint-disable-next-line no-unused-vars
    setPage: (page: number) => void;
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
    />
);
