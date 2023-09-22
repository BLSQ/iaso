import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid } from '@material-ui/core';

import { StocksParams } from '../types/stocks';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import MESSAGES from '../messages';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useFilterState } from '../../../hooks/useFilterState';
import { baseUrls } from '../../../constants/urls';
import { FilterButton } from '../../../components/FilterButton';
import { useGetDropdownStockItems } from '../hooks/requests/useGetDropdownStockItems';
import InputComponent from '../../../components/forms/InputComponent';

type Props = {
    params: StocksParams;
};
const baseUrl = baseUrls.stocks;

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const [initialOrgUnitId, setInitialOrgUnitId] = useState<
        string[] | undefined
    >(params?.orgUnitId ? [params.orgUnitId] : undefined);

    const { data: stockItems, isFetching: isFetchingStockItems } =
        useGetDropdownStockItems();
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('orgUnitId', id);
        },
        [handleChange],
    );
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.org_unit}
                    onConfirm={handleOrgUnitChange}
                    initialSelection={initialOrgUnit}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="stockItem"
                    loading={isFetchingStockItems}
                    onChange={handleChange}
                    value={filters.stockItem}
                    label={MESSAGES.stockItem}
                    options={stockItems}
                />
            </Grid>
            <Grid container item xs={12} md={6} justifyContent="flex-end">
                <Box mt={2}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
