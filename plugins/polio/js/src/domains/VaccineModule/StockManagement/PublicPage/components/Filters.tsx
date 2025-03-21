import React, { FunctionComponent } from 'react';
import { useFilterState } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import { baseUrls } from '../../../../../constants/urls';

type Props = {
    params: any;
};

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const { filters, filtersUpdated, handleChange, handleSearch } =
        useFilterState({
            baseUrl: baseUrls.embeddedVaccineStock,
            params,
        });
    return <div />;
};
