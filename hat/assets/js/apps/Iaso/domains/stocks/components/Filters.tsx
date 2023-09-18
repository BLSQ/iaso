import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useState } from 'react';

import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { StocksParams } from '../types/stocks';

import { useFilterState } from '../../../hooks/useFilterState';

import { useGetDropdownStockItems } from '../hooks/useGetDropdownStockItems';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

type Props = {
    params: StocksParams;
};

const baseUrl = baseUrls.stocks;
export const Filters: FunctionComponent<Props> = ({ params }) => {
    const [initialParentId, setInitialParentId] = useState<
        string[] | undefined
    >(params?.orgUnitId ? [params.orgUnitId] : undefined);
    const { data: initialParent } = useGetOrgUnit(initialParentId);
    const { data: items, isFetching: isFetchingItems } =
        useGetDropdownStockItems();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const handleParentChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialParentId(id);
            handleChange('orgUnitId', id);
        },
        [handleChange],
    );
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.org_unit}
                        onConfirm={handleParentChange}
                        initialSelection={initialParent}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="stockItem"
                        loading={isFetchingItems}
                        onChange={handleChange}
                        value={filters.stockItem}
                        label={MESSAGES.stockItem}
                        options={items}
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
        </>
    );
};
