import React, { FunctionComponent } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';

import Workflow from 'Iaso/components/svg/Workflow';
import { baseUrls } from 'Iaso/constants/urls';
import { Filters } from 'Iaso/domains/stock/components/Filters';
import { AddSkuDialog } from 'Iaso/domains/stock/components/SkuDialog';
import { Params } from 'Iaso/domains/stock/types/filters';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import TopBar from '../../components/nav/TopBarComponent';
import { useColumns, baseUrl } from './config';
import { useGetStockKeepingUnitPaginated, useSaveSku } from './hooks/requests';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const StockKeepingUnits: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const { data, isFetching } = useGetStockKeepingUnitPaginated(params);
    const { mutate: saveSku, isLoading: saving } = useSaveSku();
    const columns = useColumns();
    return (
        <>
            {isFetching || (saving && <LoadingSpinner />)}
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <Grid mr={3} item>
                        <Button
                            color="primary"
                            onClick={() =>
                                redirectTo(`/${baseUrls.stockRulesVersions}`)
                            }
                            variant="contained"
                            startIcon={<Workflow />}
                        >
                            {formatMessage(MESSAGES.rules)}
                        </Button>
                    </Grid>
                    <Grid item>
                        <AddSkuDialog
                            titleMessage={formatMessage(MESSAGES.add)}
                            saveSku={saveSku}
                            iconProps={{}}
                        />
                    </Grid>
                </Grid>
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
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
