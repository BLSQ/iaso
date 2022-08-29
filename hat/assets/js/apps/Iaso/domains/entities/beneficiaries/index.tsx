import React, { FunctionComponent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid, Tabs, Tab } from '@material-ui/core';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    Table,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    // AddButton as AddButtonComponent,
} from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';
import { Filters } from './components/Filters';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
// import { Dialog } from './components/Dialog';
import {
    useGetBeneficiariesPaginated,
    useGetBeneficiariesApiParams,
    // useDeleteBeneficiary,
    // useSaveBeneficiary,
} from './hooks/requests';

import { useColumns, baseUrl } from './config';
import MESSAGES from '../messages';

import { redirectTo } from '../../../routing/actions';
import { ListMap } from './components/ListMap';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    tab?: string;
    search?: string;
    entityTypes?: string;
};

type Props = {
    params: Params;
};

export const Beneficiaries: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const columns = useColumns();
    const { url: apiUrl } = useGetBeneficiariesApiParams(params);

    const { data, isFetching } = useGetBeneficiariesPaginated(params);
    const [tab, setTab] = useState(params.tab ?? 'list');
    // const { mutate: deleteEntity, isLoading: deleting } =
    //     useDeleteBeneficiary();
    // const { mutate: saveEntity, isLoading: saving } = useSaveBeneficiary();

    // const isLoading = fetchingEntities || deleting || saving;
    const isLoading = isFetching;
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        dispatch(redirectTo(baseUrl, newParams));
    };

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.beneficiaries)}
                displayBackButton={false}
            >
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={(_, newtab) => handleChangeTab(newtab)}
                >
                    <Tab value="list" label={formatMessage(MESSAGES.list)} />
                    <Tab value="map" label={formatMessage(MESSAGES.map)} />
                </Tabs>
            </TopBar>
            <Box p={2}>
                <Filters params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    {/* <Dialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent
                                dataTestId="add-beneficiary-button"
                                onClick={openDialog}
                            />
                        )}
                        saveEntity={saveEntity}
                    /> */}
                </Grid>

                <Box position="relative" width="100%" pb={2}>
                    <Box
                        pt={2}
                        width="100%"
                        className={tab === 'map' ? '' : classes.hiddenOpacity}
                    >
                        {!isFetching && (
                            <ListMap
                                locations={
                                    data?.beneficiary?.map(beneficiary => ({
                                        latitude:
                                            beneficiary.attributes?.org_unit
                                                ?.latitude,
                                        longitude:
                                            beneficiary.attributes?.org_unit
                                                ?.longitude,
                                        orgUnit:
                                            beneficiary.attributes?.org_unit,
                                        id: beneficiary.id,
                                        original: {
                                            ...beneficiary,
                                        },
                                    })) || []
                                }
                                isFetchingLocations={isFetching}
                            />
                        )}
                    </Box>
                    {tab === 'list' && (
                        <>
                            <Table
                                data={data?.beneficiary ?? []}
                                pages={data?.pages ?? 1}
                                defaultSorted={[{ id: 'name', desc: false }]}
                                columns={columns}
                                count={data?.count ?? 0}
                                baseUrl={baseUrl}
                                params={params}
                                onTableParamsChange={p =>
                                    dispatch(redirectTo(baseUrl, p))
                                }
                            />
                            <DownloadButtonsComponent
                                csvUrl={`${apiUrl}&csv=true`}
                                xlsxUrl={`${apiUrl}&xlsx=true`}
                            />
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
};
