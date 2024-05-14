import { Box, Grid, Tab, Tabs } from '@mui/material';
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Column } from 'bluesquare-components';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { ColumnSelect } from '../../instances/components/ColumnSelect';
import { ActionCell } from './ActionCell';
import { MissingInstanceDialog } from './MissingInstanceDialog';
import { OrgunitType } from '../../orgUnits/types/orgunitTypes';
import { OrgunitTypeRegistry } from '../types/orgunitTypes';
import { RegistryDetailParams } from '../types';
import { Form } from '../../forms/types/forms';
import { useGetForms } from '../hooks/useGetForms';
import { useGetInstanceApi, useGetInstances } from '../hooks/useGetInstances';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useRedirectToReplace } from '../../../routing/routing';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { defaultSorted, INSTANCE_METAS_FIELDS } from '../config';
import { useGetEmptyInstanceOrgUnits } from '../hooks/useGetEmptyInstanceOrgUnits';
import MESSAGES from '../messages';

type Props = {
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypeRegistry[];
    params: RegistryDetailParams;
};

export const Instances: FunctionComponent<Props> = ({
    isLoading,
    subOrgUnitTypes,
    params,
}) => {
    const currentUser = useCurrentUser();
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

    const { data: formsList, isFetching: isFetchingForms } = useGetForms({
        orgUnitTypeIds: currentType?.id,
    });

    const { url: apiUrl } = useGetInstanceApi(params, currentType?.id, 'VALID');
    const { data, isFetching: isFetchingList } = useGetInstances(
        params,
        currentType?.id,
    );

    const {
        data: orgUnitsWithoutCurrentForm,
        isFetching: isFetchingOrgUnitsWithoutCurrentForm,
    } = useGetEmptyInstanceOrgUnits(params, currentType?.id);

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
            };
            delete newParams.formIds;
            redirectToReplace(baseUrls.registry, newParams);
        },
        [params, redirectToReplace],
    );

    const currentForm: Form | undefined = useMemo(() => {
        return formsList?.find(f => `${f.value}` === formIds)?.original;
    }, [formIds, formsList]);
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
                                        getActionCell={settings => (
                                            <ActionCell settings={settings} />
                                        )}
                                    />
                                )}
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    width="100%"
                                    mt={2}
                                >
                                    <DownloadButtonsComponent
                                        csvUrl={`${apiUrl}&csv=true`}
                                        xlsxUrl={`${apiUrl}&xlsx=true`}
                                        disabled={
                                            isFetchingList || data?.count === 0
                                        }
                                    />
                                </Box>
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    width="100%"
                                    mt={2}
                                >
                                    {orgUnitsWithoutCurrentForm &&
                                        orgUnitsWithoutCurrentForm.count > 0 &&
                                        userHasPermission(
                                            Permission.SUBMISSIONS_UPDATE,
                                            currentUser,
                                        ) && (
                                            <MissingInstanceDialog
                                                isFetching={
                                                    isFetchingOrgUnitsWithoutCurrentForm
                                                }
                                                formId={formIds}
                                                missingOrgUnitsData={
                                                    orgUnitsWithoutCurrentForm
                                                }
                                                params={params}
                                                iconProps={{
                                                    count: orgUnitsWithoutCurrentForm.count,
                                                    params,
                                                }}
                                                defaultOpen={
                                                    params.missingSubmissionVisible ===
                                                    'true'
                                                }
                                            />
                                        )}
                                </Box>
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
                            extraProps={{ loading: isFetchingList }}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
