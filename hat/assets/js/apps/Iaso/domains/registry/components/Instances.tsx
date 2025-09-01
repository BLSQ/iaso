import { Box, Grid, Tab, Tabs, Typography } from '@mui/material';
import {
    Column,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import * as Permissions from '../../../utils/permissions';
import { Form } from '../../forms/types/forms';
import { ColumnSelect } from '../../instances/components/ColumnSelect';
import { OrgunitType } from '../../orgUnits/types/orgunitTypes';
import { INSTANCE_METAS_FIELDS, defaultSorted } from '../config';
import { useGetEmptyInstanceOrgUnits } from '../hooks/useGetEmptyInstanceOrgUnits';
import { useGetForms } from '../hooks/useGetForms';
import { useGetInstanceApi, useGetInstances } from '../hooks/useGetInstances';
import { useGetOrgUnitType } from '../hooks/useGetOrgUnitType';
import MESSAGES from '../messages';
import { RegistryParams } from '../types';
import { OrgunitTypeRegistry } from '../types/orgunitTypes';
import { ActionCell } from './ActionCell';
import { MissingInstanceDialog } from './MissingInstanceDialog';
import { periodTypeOptions } from '../../periods/constants';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { Period } from '../../periods/models';

type Props = {
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypeRegistry[];
    params: RegistryParams;
};

const baseUrl = baseUrls.registry;
export const Instances: FunctionComponent<Props> = ({
    isLoading,
    subOrgUnitTypes,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [tableColumns, setTableColumns] = useState<Column[]>([]);
    let { formIds, tab, periodType, startPeriod, endPeriod } = params;
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
            if (key == 'periodType' || value === null) {
                delete params?.startPeriod;
                delete params?.endPeriod;
            }
            redirectToReplace(baseUrls.registry, {
                ...params,
                [key]: value,
            });
        },
        [params, redirectToReplace],
    );

    const periodError = useMemo(() => {
        if (startPeriod && endPeriod) {
            return !Period.isBeforeOrEqual(startPeriod, endPeriod);
        }
        return false;
    }, [startPeriod, endPeriod]);

    const handleChangeTab = useCallback(
        (newType: OrgunitType) => {
            const newParams = {
                ...params,
                tab: `${newType.id}`,
                formIds: undefined,
                periodType: undefined,
                startPeriod: undefined,
                endPeriod: undefined,
            };
            redirectToReplace(baseUrls.registry, newParams);
        },
        [params, redirectToReplace],
    );

    const { data: orgunitTypeDetail } = useGetOrgUnitType(currentType?.id);
    const { data: formsList, isFetching: isFetchingForms } = useGetForms({
        orgUnitTypeIds: currentType?.id,
    });
    const currentForm: Form | undefined = useMemo(() => {
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
                      formsList[0]?.value;
            const newParams = {
                ...params,
                formIds: selectedForm,
                periodType: currentForm?.period_type,
            };
            redirectToReplace(`/${baseUrl}`, newParams);
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
                        <Grid container spacing={1}>
                            <Grid item xs={4} md={2}>
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
                            <Grid item xs={4} md={2}>
                                <InputComponent
                                    keyValue="periodType"
                                    clearable
                                    onChange={handleFilterChange}
                                    value={periodType}
                                    type="select"
                                    options={periodTypeOptions}
                                    label={MESSAGES.periodType}
                                />
                            </Grid>
                            <Grid item xs={4} md={2}>
                                <PeriodPicker
                                    hasError={periodError}
                                    activePeriodString={startPeriod}
                                    periodType={periodType || ''}
                                    title={formatMessage(MESSAGES.startPeriod)}
                                    keyName="startPeriod"
                                    onChange={value =>
                                        handleFilterChange('startPeriod', value)
                                    }
                                />
                            </Grid>
                            <Grid item xs={4} md={2}>
                                <PeriodPicker
                                    hasError={periodError}
                                    activePeriodString={endPeriod}
                                    periodType={periodType || ''}
                                    title={formatMessage(MESSAGES.endPeriod)}
                                    keyName="endPeriod"
                                    onChange={value =>
                                        handleFilterChange('endPeriod', value)
                                    }
                                />
                                {periodError && (
                                    <Box mt={-1}>
                                        <Typography
                                            variant="body1"
                                            color="error"
                                            fontSize="small"
                                        >
                                            {formatMessage(
                                                MESSAGES.periodError,
                                            )}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid
                                item
                                container
                                xs={4}
                                md={4}
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
                                        // eslint-disable-next-line react/no-unstable-nested-components
                                        getActionCell={settings => (
                                            <ActionCell settings={settings} />
                                        )}
                                    />
                                )}
                                <DisplayIfUserHasPerm
                                    permissions={[Permissions.REGISTRY_WRITE]}
                                >
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
                                                isFetchingList ||
                                                data?.count === 0 ||
                                                !formIds
                                            }
                                        />
                                    </Box>
                                </DisplayIfUserHasPerm>
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    width="100%"
                                    mt={2}
                                >
                                    {orgUnitsWithoutCurrentForm &&
                                        orgUnitsWithoutCurrentForm.count >
                                            0 && (
                                            <DisplayIfUserHasPerm
                                                strict
                                                permissions={[
                                                    Permissions.REGISTRY_WRITE,
                                                    Permissions.SUBMISSIONS_UPDATE,
                                                ]}
                                            >
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
                                            </DisplayIfUserHasPerm>
                                        )}
                                </Box>
                            </Grid>
                        </Grid>
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
