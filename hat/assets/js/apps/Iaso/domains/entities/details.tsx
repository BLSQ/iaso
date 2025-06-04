import React, { FunctionComponent, useMemo } from 'react';
import { Box, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import { CsvButton } from '../../components/Buttons/CsvButton';
import { XlsxButton } from '../../components/Buttons/XslxButton';
import TopBar from '../../components/nav/TopBarComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { EntityBaseInfo } from './components/EntityBaseInfo';
import { useEntitiesDetailsColumns } from './config';
import { useGetEntity, useGetSubmissions } from './hooks/requests';
import { useGetEntityFields } from './hooks/useGetEntityFields';
import MESSAGES from './messages';
import { Entity } from './types/entity';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%', height: 'auto' },
}));

export const Details: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entityDetails);
    const goBack = useGoBack(baseUrls.entities);
    const classes: Record<string, string> = useStyles();
    const { entityId } = params;
    const { formatMessage } = useSafeIntl();

    const {
        data: entity,
    }: {
        data?: Entity;
    } = useGetEntity(entityId as string);
    const { isLoading: isLoadingEntityFields, fields: entityFields } =
        useGetEntityFields(entity);

    const columns = useEntitiesDetailsColumns(entity?.id ?? null, []);

    const { data, isLoading: isLoadingSubmissions } = useGetSubmissions(
        params,
        parseInt(entityId as string, 10),
    );

    const duplicates = useMemo(() => {
        return entity?.duplicates ?? [];
    }, [entity]);

    const duplicateUrl =
        duplicates.length === 1
            ? `/${baseUrls.entityDuplicateDetails}/entities/${entityId},${duplicates[0]}/`
            : `/${baseUrls.entityDuplicates}/order/id/pageSize/50/page/1/entity_id/${entityId}/`;

    const isLoading = !entity || isLoadingEntityFields || isLoadingSubmissions;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.entity)}
                displayBackButton
                goBack={goBack}
            />
            {isLoading && <LoadingSpinner />}
            {!isLoading && (
                <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                    <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} md={4}>
                            <EntityBaseInfo
                                entity={entity}
                                fields={entityFields}
                                hasDuplicates={duplicates.length > 0}
                                duplicateUrl={duplicateUrl}
                            />
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <WidgetPaper
                                className={classes.fullWidth}
                                title={formatMessage(MESSAGES.submissions)}
                            >
                                <Divider />
                                <TableWithDeepLink
                                    marginTop={false}
                                    marginBottom={false}
                                    countOnTop={false}
                                    elevation={0}
                                    baseUrl={baseUrls.entityDetails}
                                    data={data?.instances ?? []}
                                    pages={data?.pages}
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    columns={columns}
                                    count={data?.count}
                                    params={params}
                                    extraProps={{
                                        loading: isLoadingSubmissions,
                                    }}
                                />
                                <Divider />
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    p={2}
                                >
                                    <Box mr={1} ml={2}>
                                        <CsvButton
                                            csvUrl={`/api/entities/?csv=true&id=${entityId}`}
                                        />
                                    </Box>
                                    <XlsxButton
                                        xlsxUrl={`/api/entities/?xlsx=true&id=${entityId}`}
                                    />
                                </Box>
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </>
    );
};
