import React, { FunctionComponent, useState } from 'react';
import { Box, Tabs, Tab, Grid } from '@material-ui/core';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import InputComponent from '../../../components/forms/InputComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';

import { redirectToReplace } from '../../../routing/actions';

import { OrgunitTypes, OrgunitType } from '../../orgUnits/types/orgunitTypes';
import { RegistryDetailParams } from '../types';

import { useGetForms } from '../hooks/useGetForms';
import { useGetInstances } from '../hooks/useGetInstances';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { defaultSorted } from '../config';

type Props = {
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypes;
    params: RegistryDetailParams;
};

export const Instances: FunctionComponent<Props> = ({
    isLoading,
    subOrgUnitTypes,
    params,
}) => {
    const { formId } = params;
    const [currentType, setCurrentType] = useState<OrgunitType | undefined>();

    const dispatch = useDispatch();

    const { data: formsList, isFetching: isFetchingForms } = useGetForms();
    const { data, isFetching: isFetchingList } = useGetInstances(
        params,
        currentType?.id,
    );
    const handleFilterChange = (key: string, value: number | string) => {
        dispatch(
            redirectToReplace(baseUrls.registryDetail, {
                ...params,
                [key]: value,
            }),
        );
    };

    useSkipEffectOnMount(() => {
        if (subOrgUnitTypes?.length > 0 && !currentType) {
            setCurrentType(subOrgUnitTypes[0]);
        }
    }, [subOrgUnitTypes]);

    return (
        <Box>
            {currentType && !isLoading && (
                <>
                    <Tabs
                        value={currentType}
                        onChange={(_, newtab) => setCurrentType(newtab)}
                    >
                        {subOrgUnitTypes.map(subType => (
                            <Tab
                                value={subType}
                                label={subType.name}
                                key={subType.id}
                            />
                        ))}
                    </Tabs>
                    <Box mt={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <InputComponent
                                    required
                                    keyValue="formId"
                                    clearable={false}
                                    onChange={handleFilterChange}
                                    disabled={isFetchingForms}
                                    loading={isFetchingForms}
                                    value={formId}
                                    type="select"
                                    options={formsList}
                                    label={MESSAGES.form}
                                />
                            </Grid>
                        </Grid>
                        <TableWithDeepLink
                            marginTop={false}
                            baseUrl={baseUrls.registryDetail}
                            data={data?.instances ?? []}
                            pages={data?.pages ?? 1}
                            defaultSorted={defaultSorted}
                            columns={[
                                {
                                    Header: 'uuid',
                                    accessor: 'uuid',
                                },
                                {
                                    Header: 'Ou Name',
                                    accessor: 'org_unit__name',
                                    Cell: settings =>
                                        `${settings.row.original.org_unit.name} ${settings.row.original.org_unit.org_unit_type_name}`,
                                },
                            ]}
                            count={data?.count ?? 0}
                            params={params}
                            onTableParamsChange={p =>
                                dispatch(
                                    redirectToReplace(
                                        baseUrls.registryDetail,
                                        p,
                                    ),
                                )
                            }
                            extraProps={{ loading: isFetchingList }}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
