import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useActiveParams } from '../../routing/hooks/useActiveParams';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { SxStyles } from '../../types/general';
import { PlanningFilters } from './components/list/PlanningFilters';
import { usePlanningColumns } from './config';
import { useGetPlannings } from './hooks/requests/useGetPlannings';
import MESSAGES from './messages';
import { Planning as PlanningType, PlanningParams } from './types';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.planning;

const styles = {
    deprecatedRow: {
        '& td:not(:last-child)': { opacity: 0.5 },
    },
} satisfies SxStyles;

const getRowProps = ({ original }: { original: PlanningType }) =>
    original.deprecated ? { sx: styles.deprecatedRow } : {};

export const Planning: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const apiParams = useActiveParams(params) as PlanningParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetPlannings(apiParams);
    const columns = usePlanningColumns(params, data?.count ?? 0);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <PlanningFilters params={apiParams} />

                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                    columnSelectorEnabled
                    countOnTop={false}
                    rowProps={getRowProps}
                />
            </Box>
        </>
    );
};
