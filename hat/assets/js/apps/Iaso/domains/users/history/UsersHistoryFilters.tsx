import React, { FunctionComponent } from 'react';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';

type Props = {
    params: Record<string, string>;
};

export const UsersHistoryFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.usersHistory, params });

    return <div>Filters here</div>;
};
