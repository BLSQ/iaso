import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    Table,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import MESSAGES from 'Iaso/domains/stock/messages';
import { AddVersionModal } from 'Iaso/domains/stock/versions/components/AddVersionModal';
import {
    RulesFilters,
    VersionFilters,
} from 'Iaso/domains/stock/versions/components/Filters';
import { AddRuleDialog } from 'Iaso/domains/stock/versions/components/RuleDialog';
import { VersionBaseInfo } from 'Iaso/domains/stock/versions/components/VersionBaseInfo';
import { Params } from 'Iaso/domains/stock/versions/types/filters';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { useVersionsColumns, baseUrl, useRulesColumns } from './config';
import {
    useGetStockRulesVersionsPaginated,
    useGetStockRulesVersion,
    useSaveStockItemRule,
    useDeleteStockItemRule,
    useGetStockItemRulesPaginated,
} from './hooks/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

export const StockRulesVersions: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    return (
        <>
            {params.versionId === undefined && (
                <StockRulesVersionsList params={params} />
            )}
            {params.versionId !== undefined && (
                <StockRulesList params={params} versionId={params.versionId} />
            )}
        </>
    );
};

type Props = {
    params: Params;
};

const StockRulesVersionsList: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStockRulesVersionsPaginated(params);
    const redirectTo = useRedirectTo();
    const columns = useVersionsColumns();
    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.titleVersion)}
                displayBackButton={true}
                goBack={() => redirectTo(baseUrls.stockKeepingUnits)}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VersionFilters params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <AddVersionModal iconProps={{}} />
                </Grid>
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'id', desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};

type RulesProps = {
    params: Params;
    versionId: number;
};

const StockRulesList: FunctionComponent<RulesProps> = ({
    params,
    versionId,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: version, isFetching: isFetchingVersion } =
        useGetStockRulesVersion(versionId);
    const { data, isFetching: isFetchingRules } = useGetStockItemRulesPaginated(
        versionId,
        params,
    );
    const redirectTo = useRedirectTo();
    const { mutate: saveRule } = useSaveStockItemRule(versionId);
    const { mutate: deleteRule } = useDeleteStockItemRule();
    const columns = useRulesColumns(version, saveRule, deleteRule);
    return (
        <>
            {isFetchingRules || (isFetchingVersion && <LoadingSpinner />)}
            <TopBar
                title={version?.name}
                displayBackButton={true}
                goBack={() => redirectTo(baseUrl)}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={2}>
                    <Grid container item xs={3}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(MESSAGES.infos)}
                        >
                            <Box className={classes.infoPaperBox}>
                                {!version && <LoadingSpinner absolute />}
                                {version && (
                                    <VersionBaseInfo version={version} />
                                )}
                            </Box>
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <RulesFilters params={params} />
                </Box>
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    {version?.status === 'DRAFT' && (
                        <AddRuleDialog
                            iconProps={{}}
                            titleMessage={formatMessage(MESSAGES.add)}
                            saveRule={saveRule}
                        />
                    )}
                </Grid>
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={1}
                    defaultSorted={[{ id: 'sku', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
