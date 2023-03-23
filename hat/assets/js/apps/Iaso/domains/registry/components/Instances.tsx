import React, { FunctionComponent, useState, useMemo } from 'react';
import { Box, Tabs, Tab, Grid } from '@material-ui/core';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import InputComponent from '../../../components/forms/InputComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { ColumnSelect } from '../../instances/components/ColumnSelect';
import { ActionCell } from './ActionCell';

import { redirectToReplace } from '../../../routing/actions';

import { OrgunitTypes, OrgunitType } from '../../orgUnits/types/orgunitTypes';
import { RegistryDetailParams } from '../types';
import { Column } from '../../../types/table';
import { Form } from '../../forms/types/forms';

import { useGetForms } from '../hooks/useGetForms';
import { useGetInstances } from '../hooks/useGetInstances';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { defaultSorted, INSTANCE_METAS_FIELDS } from '../config';

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
    const [tableColumns, setTableColumns] = useState<Column[]>([]);
    const { formIds } = params;
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
    const currentForm: Form | undefined = useMemo(() => {
        return formsList?.find(f => `${f.value}` === formIds)?.original;
    }, [formIds, formsList]);
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
                                    keyValue="formIds"
                                    clearable={false}
                                    onChange={handleFilterChange}
                                    disabled={isFetchingForms}
                                    loading={isFetchingForms}
                                    value={formIds}
                                    type="select"
                                    options={formsList}
                                    label={MESSAGES.form}
                                />
                            </Grid>
                            <Grid
                                item
                                container
                                xs={12}
                                md={9}
                                justifyContent="flex-end"
                                alignItems="baseline"
                                // @ts-ignore
                                alignContent="middle"
                            >
                                {formIds && currentForm && (
                                    <ColumnSelect
                                        params={params}
                                        disabled={!formIds}
                                        periodType={currentForm.period_type}
                                        setTableColumns={newCols =>
                                            setTableColumns(newCols)
                                        }
                                        baseUrl={baseUrls.registryDetail}
                                        labelKeys={currentForm.label_keys || []}
                                        formDetails={currentForm}
                                        tableColumns={tableColumns}
                                        instanceMetasFields={
                                            INSTANCE_METAS_FIELDS
                                        }
                                        getActionCell={settings => (
                                            <ActionCell settings={settings} />
                                        )}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        <TableWithDeepLink
                            marginTop={false}
                            baseUrl={baseUrls.registryDetail}
                            data={data?.instances ?? []}
                            pages={data?.pages ?? 1}
                            defaultSorted={defaultSorted}
                            columns={tableColumns}
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
