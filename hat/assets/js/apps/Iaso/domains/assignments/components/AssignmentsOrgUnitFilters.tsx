import { Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { AssignmentParams } from '../types/assigment';

type Props = {
    params: AssignmentParams;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsOrgUnitFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { filters, handleSearch, handleChange } = useFilterState({
        baseUrl,
        params,
        withPagination: false,
    });

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.searchOrgUnit}
                    onEnterPressed={handleSearch}
                />
            </Grid>
        </Grid>
    );
};
