import React, { FunctionComponent } from 'react';
import { useFilterState } from './hooks/useFilterState';
import { PlanningParams } from './types';

type Props = {
    params: PlanningParams;
};

export const PlanningFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange } = useFilterState(params);
    return <div />;
};
