import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { Column, useRedirectToReplace } from 'bluesquare-components';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { useGetFormsDropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { Form } from '../../../../../../../hat/assets/js/apps/Iaso/domains/forms/types/forms';
import { ColumnSelect } from '../../../../../../../hat/assets/js/apps/Iaso/domains/instances/components/ColumnSelect';
import { OrgunitType } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgunitTypes';
import { baseUrls } from '../../../constants/urls';
import { defaultSorted, useGetInstances } from '../../../hooks/useGetInstances';
import { useGetOrgUnitType } from '../../../hooks/useGetOrgUnitType';
import { OrgunitTypeRegistry, RegistryParams } from '../../../types';
import { INSTANCE_METAS_FIELDS } from '../config';
import { MESSAGES } from '../messages';

type Props = {
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypeRegistry[];
    params: RegistryParams;
    appId: string;
    registrySlug: string;
};

const baseUrl = baseUrls.registry;
export const Instances: FunctionComponent<Props> = ({
    isLoading,
    subOrgUnitTypes,
    params,
    appId,
    registrySlug,
}) => {
    const redirectToReplace = useRedirectToReplace();
    const [tableColumns, setTableColumns] = useState<Column[]>([]);
    const { formIds, tab } = params;
    const currentType: OrgunitTypeRegistry | undefined = useMemo(() => {
        if (subOrgUnitTypes.length > 0) {
            if (tab) {
                const existingType: OrgunitTypeRegistry | undefined =
                    subOrgUnitTypes.find(subType => `${subType.id}` === tab);
                return existingType || subOrgUnitTypes[0];
            }
            return subOrgUnitTypes[0];
        }
        return undefined;
    }, [subOrgUnitTypes, tab]);

    const { data, isFetching: isFetchingList } = useGetInstances(
        params,
        registrySlug,
        currentType?.id,
    );

    const handleFilterChange = useCallback(
        (key: string, value: number | string) => {
            redirectToReplace(baseUrls.registry, {
                ...params,
                [key]: value,
            });
        },
        [params, redirectToReplace],
    );

    const handleChangeTab = useCallback(
        (newType: OrgunitType) => {
            const newParams = {
                ...params,
                tab: `${newType.id}`,
                formIds: undefined,
            };
            redirectToReplace(baseUrls.registry, newParams);
        },
        [params, redirectToReplace],
    );

    const { data: orgunitTypeDetail } = useGetOrgUnitType(
        currentType?.id,
        appId,
    );
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions({
            extraFields: ['period_type', 'label_keys', 'org_unit_type_ids'],
            params: {
                orgUnitTypeIds: currentType?.id,
                app_id: appId,
            },
        });
    const currentForm: Partial<Form> | undefined = useMemo(() => {
        return formsList?.find(f => `${f.value}` === formIds)?.original;
    }, [formIds, formsList]);
    useEffect(() => {
        if (
            (formsList?.length ?? 0) > 0 &&
            !isFetchingForms &&
            !formIds &&
            orgunitTypeDetail &&
            !isLoading
        ) {
            const selectedForm =
                orgunitTypeDetail.reference_forms.length > 0
                    ? `${orgunitTypeDetail.reference_forms[0].id}`
                    : // @ts-ignore formsList cannot be undefined since we check it in the condition
                      `${formsList[0]?.value}`;
            const newParams = {
                ...params,
                formIds: selectedForm,
            };
            redirectToReplace(baseUrl, newParams);
        }
        // Only preselect a form if forms list contain an element and params is empty
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formsList, isFetchingForms, orgunitTypeDetail, redirectToReplace]);
    return (
        <Box>
            {currentType && !isLoading && (
                <>
                    <Tabs
                        value={currentType}
                        onChange={(_, newtab) => handleChangeTab(newtab)}
                    >
                        {subOrgUnitTypes.map(subType => (
                            <Tab
                                value={subType}
                                label={`${subType.name} (${subType.orgUnits.length})`}
                                key={subType.id}
                            />
                        ))}
                    </Tabs>
                    <Box mt={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <InputComponent
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
                                alignContent="center"
                            >
                                {formIds && currentForm && (
                                    <ColumnSelect
                                        params={params}
                                        disabled={!formIds}
                                        periodType={currentForm.period_type}
                                        setTableColumns={newCols =>
                                            setTableColumns(newCols)
                                        }
                                        baseUrl={baseUrls.registry}
                                        labelKeys={currentForm.label_keys || []}
                                        formDetails={currentForm}
                                        tableColumns={tableColumns}
                                        instanceMetasFields={
                                            INSTANCE_METAS_FIELDS
                                        }
                                        appId={appId}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        {/* @ts-ignore */}
                        <TableWithDeepLink
                            marginTop={false}
                            baseUrl={baseUrls.registry}
                            data={data?.instances ?? []}
                            pages={data?.pages ?? 1}
                            defaultSorted={defaultSorted}
                            columns={tableColumns}
                            count={data?.count ?? 0}
                            params={params}
                            extraProps={{
                                loading: isFetchingList,
                            }}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
