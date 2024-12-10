import { Box, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LinkButton,
    LoadingSpinner,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useMemo } from 'react';
import { CsvButton } from '../../components/Buttons/CsvButton';
import { XlsxButton } from '../../components/Buttons/XslxButton';
import TopBar from '../../components/nav/TopBarComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { BeneficiaryBaseInfo } from './components/BeneficiaryBaseInfo';
import { useBeneficiariesDetailsColumns } from './config';
import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';
import { useGetBeneficiaryFields } from './hooks/useGetBeneficiaryFields';
import MESSAGES from './messages';
import { Beneficiary } from './types/beneficiary';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%' },
}));

export const Details: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entityDetails);
    const goBack = useGoBack(baseUrls.entities);
    const classes: Record<string, string> = useStyles();
    const { entityId } = params;
    const { formatMessage } = useSafeIntl();

    const {
        data: beneficiary,
    }: {
        data?: Beneficiary;
    } = useGetBeneficiary(entityId as string);
    const { isLoading: isLoadingBeneficiaryFields, fields: beneficiaryFields } =
        useGetBeneficiaryFields(beneficiary);

    const columns = useBeneficiariesDetailsColumns(beneficiary?.id ?? null, []);

    const { data, isLoading: isLoadingSubmissions } = useGetSubmissions(
        params,
        parseInt(entityId as string, 10),
    );

    const duplicates = useMemo(() => {
        return beneficiary?.duplicates ?? [];
    }, [beneficiary]);

    const duplicateUrl =
        duplicates.length === 1
            ? `/${baseUrls.entityDuplicateDetails}/entities/${entityId},${duplicates[0]}/`
            : `/${baseUrls.entityDuplicates}/order/id/pageSize/50/page/1/entity_id/${entityId}/`;

    const isLoading =
        !beneficiary || isLoadingBeneficiaryFields || isLoadingSubmissions;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.beneficiary)}
                displayBackButton
                goBack={goBack}
            />
            {isLoading && <LoadingSpinner />}
            {!isLoading && (
                <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                    <Grid container spacing={2}>
                        <Grid container item xs={12} md={4}>
                            <BeneficiaryBaseInfo
                                beneficiary={beneficiary}
                                fields={beneficiaryFields}
                            />
                        </Grid>

                        <Grid container item xs={12} md={8}>
                            <WidgetPaper
                                className={classes.fullWidth}
                                title={formatMessage(MESSAGES.submissions)}
                            >
                                <TableWithDeepLink
                                    marginTop={false}
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
                                <Box display="flex" py={2}>
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
                        {/* <Grid container item xs={7} justifyContent="flex-end">
                            <Box>
                                <LinkButton to={duplicateUrl}>
                                    {formatMessage(MESSAGES.seeDuplicates)}
                                </LinkButton>
                            </Box>
                        </Grid> */}
                        {duplicates.length > 0 && (
                            <Grid
                                container
                                item
                                xs={7}
                                justifyContent="flex-end"
                            >
                                <Box>
                                    <LinkButton to={duplicateUrl}>
                                        {formatMessage(MESSAGES.seeDuplicates)}
                                    </LinkButton>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}
        </>
    );
};
