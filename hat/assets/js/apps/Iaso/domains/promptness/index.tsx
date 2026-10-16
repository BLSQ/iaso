import React, { FunctionComponent, useMemo } from 'react';
import { AccountTree, ListAlt, OpenInNew } from '@mui/icons-material';
import { Box, Button, Divider, Paper, Typography } from '@mui/material';
import {
    LoadingSpinner,
    makeRedirectionUrl,
    useSafeIntl,
} from 'bluesquare-components';
import { Link as RouterLink } from 'react-router-dom';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from 'Iaso/utils/permissions';
import TopBar from '../../components/nav/TopBarComponent';
import { useGetFormsDropdownOptions } from '../forms/hooks/useGetFormsDropdownOptions';
import { useGetOrgUnit } from '../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { DeadlineBanner } from './components/DeadlineBanner';
import { EmptyState } from './components/EmptyState';
import { OrgUnitPath } from './components/OrgUnitPath';
import { PromptnessFilters } from './components/PromptnessFilters';
import { TotalsCards } from './components/TotalsCards';
import { DEFAULT_PAGE_SIZE, ORG_UNIT_FIELDS } from './constants';
import {
    canComputePromptness,
    useGetPromptnessStats,
    useGetPromptnessSummary,
} from './hooks/api/usePromptnessStats';
import { useFormatPeriod } from './hooks/useFormatPeriod';
import { usePromptnessColumns } from './hooks/usePromptnessColumns';
import MESSAGES from './messages';
import { PromptnessRouterParams } from './types';
import { getDefaultOrder } from './utils';

const baseUrl = baseUrls.promptness;

const FORM_EXTRA_FIELDS = [
    'period_type',
    'promptness_grace_period_days',
    'org_unit_types',
    'org_unit_type_ids',
    'org_unit_group_ids',
];

const styles: SxStyles = {
    totalsTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: 2,
        mb: 1,
        color: 'text.secondary',
        '& svg': {
            fontSize: 18,
        },
    },
    tableHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
    },
};

export const Promptness: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as PromptnessRouterParams;
    const { formatMessage } = useSafeIntl();
    const formatPeriod = useFormatPeriod();

    const { data: forms, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions({ extraFields: FORM_EXTRA_FIELDS });
    // The promptness can only be computed for forms with a period type
    const formsWithPeriod = useMemo(
        () => forms?.filter(form => Boolean(form.original.period_type)),
        [forms],
    );
    const selectedForm = formsWithPeriod?.find(
        form => `${form.value}` === params.formId,
    )?.original;

    // The org unit whose figures are displayed: the parent org unit of the filters, or one drilled down below it
    const currentOrgUnitId = params.orgUnitId ?? params.parentId;
    const { data: currentOrgUnit } = useGetOrgUnit(
        currentOrgUnitId,
        ORG_UNIT_FIELDS,
    );
    const { data: orgUnitTypes } = useGetOrgUnitTypesDropdownOptions();
    const orgUnitTypeNames = useMemo(
        () =>
            Object.fromEntries(
                (orgUnitTypes ?? []).map(type => [type.value, type.label]),
            ),
        [orgUnitTypes],
    );

    const isReady = canComputePromptness(params, selectedForm);
    const { data: summary, isFetching: isFetchingSummary } =
        useGetPromptnessSummary(params, isReady);
    const { data: stats, isFetching: isFetchingStats } = useGetPromptnessStats(
        params,
        isReady,
    );
    const columns = usePromptnessColumns(params, orgUnitTypeNames);
    const defaultOrder = getDefaultOrder(params.status);

    const currentOrgUnitName = currentOrgUnit?.name ?? '';
    const periodLabel = formatPeriod(params.period);
    const submissionsUrl = selectedForm?.period_type
        ? makeRedirectionUrl(baseUrls.instances, {
              formIds: params.formId,
              periodType: selectedForm.period_type,
              startPeriod: params.period,
              endPeriod: params.period,
              levels: currentOrgUnitId,
              tab: 'list',
              isSearchActive: 'true',
          })
        : undefined;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.promptness)}
                displayBackButton={false}
            />
            <MainWrapper sx={{ p: 4 }}>
                <PromptnessFilters
                    // Reset the filters state when drilling down from the table
                    key={currentOrgUnitId}
                    orgUnitId={currentOrgUnitId}
                    params={params}
                    forms={formsWithPeriod}
                    isFetchingForms={isFetchingForms}
                    canExport={isReady}
                />
                {!params.formId && (
                    <EmptyState
                        title={formatMessage(MESSAGES.selectForm)}
                        description={formatMessage(MESSAGES.selectFormInfo)}
                        action={
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<ListAlt />}
                                component={RouterLink}
                                to={`/${baseUrls.forms}`}
                            >
                                {formatMessage(MESSAGES.browseForms)}
                            </Button>
                        }
                    />
                )}

                {params.formId && !isReady && isFetchingForms && (
                    <LoadingSpinner />
                )}
                {params.formId && !isReady && !isFetchingForms && (
                    <EmptyState
                        title={formatMessage(MESSAGES.selectFilters)}
                        description={formatMessage(MESSAGES.selectFiltersInfo)}
                    />
                )}
                {isReady && (
                    <Box mt={2} position="relative">
                        {isFetchingSummary && <LoadingSpinner absolute />}
                        {summary && (
                            <>
                                <DeadlineBanner
                                    period={summary.period}
                                    periodLabel={periodLabel}
                                    form={selectedForm}
                                />
                                <Box sx={styles.totalsTitle}>
                                    <AccountTree />
                                    <Typography variant="body2">
                                        {formatMessage(MESSAGES.totalsFor)}
                                    </Typography>
                                    <OrgUnitPath
                                        orgUnit={currentOrgUnit}
                                        rootId={params.parentId}
                                    />
                                    <Typography variant="body2">
                                        {`· ${periodLabel}`}
                                    </Typography>
                                </Box>
                                <TotalsCards
                                    totals={summary.totals}
                                    orgUnitName={currentOrgUnitName}
                                />
                            </>
                        )}
                        <Paper sx={{ mt: 2 }}>
                            <Box sx={styles.tableHeader}>
                                <Typography variant="h6">
                                    {formatMessage(MESSAGES.orgUnitsIn, {
                                        orgUnit: currentOrgUnitName,
                                    })}
                                </Typography>
                                {submissionsUrl && (
                                    <DisplayIfUserHasPerm
                                        permissions={[
                                            SUBMISSIONS,
                                            SUBMISSIONS_UPDATE,
                                        ]}
                                    >
                                        <Button
                                            size="small"
                                            color="primary"
                                            startIcon={<OpenInNew />}
                                            component={RouterLink}
                                            to={submissionsUrl}
                                        >
                                            {formatMessage(
                                                MESSAGES.openSubmissions,
                                            )}
                                        </Button>
                                    </DisplayIfUserHasPerm>
                                )}
                            </Box>
                            <Divider />
                            <Box px={2} pb={1}>
                                <TableWithDeepLink
                                    data={stats?.results ?? []}
                                    pages={stats?.pages ?? 1}
                                    count={stats?.count ?? 0}
                                    defaultSorted={[
                                        {
                                            id: defaultOrder.replace('-', ''),
                                            desc: defaultOrder.startsWith('-'),
                                        },
                                    ]}
                                    columns={columns}
                                    baseUrl={baseUrl}
                                    params={params}
                                    extraProps={{
                                        loading: isFetchingStats,
                                        defaultPageSize: DEFAULT_PAGE_SIZE,
                                    }}
                                    elevation={0}
                                    countOnTop
                                />
                            </Box>
                        </Paper>
                    </Box>
                )}
            </MainWrapper>
        </>
    );
};
