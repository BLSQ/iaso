import React, { FunctionComponent, useMemo } from 'react';
import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
    useGoBack,
    LinkButton,
} from 'bluesquare-components';
import { Box, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';
import { Beneficiary } from './types/beneficiary';
import { useBeneficiariesDetailsColumns } from './config';
import { CsvButton } from '../../components/Buttons/CsvButton';
import { XlsxButton } from '../../components/Buttons/XslxButton';
import { BeneficiaryBaseInfo } from './components/BeneficiaryBaseInfo';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useParamsObject } from '../../routing/hooks/useParamsObject';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%' },
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

export const Details: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entityDetails);
    const goBack = useGoBack(baseUrls.entities);
    const classes: Record<string, string> = useStyles();
    const { entityId } = params;
    const { formatMessage } = useSafeIntl();

    const {
        data: beneficiary,
        isLoading: isLoadingBeneficiary,
    }: {
        data?: Beneficiary;
        isLoading: boolean;
    } = useGetBeneficiary(entityId as string);
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

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.beneficiary)}
                displayBackButton
                goBack={goBack}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={4}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(MESSAGES.beneficiaryInfo)}
                        >
                            <Box className={classes.infoPaperBox}>
                                {!beneficiary && <LoadingSpinner absolute />}
                                <BeneficiaryBaseInfo
                                    beneficiary={beneficiary}
                                />
                            </Box>
                        </WidgetPaper>
                    </Grid>
                    {duplicates.length > 0 && (
                        <Grid container item xs={8} justifyContent="flex-end">
                            <Box>
                                <LinkButton to={duplicateUrl}>
                                    {formatMessage(MESSAGES.seeDuplicates)}
                                </LinkButton>
                            </Box>
                        </Grid>
                    )}
                    {/* TODO uncomment when edition is possible */}
                    {/* <Grid container item xs={1}>
                        <Box ml={2}>
                            <EditIcon
                                onClick={() => {
                                    console.log(
                                        'Edit Beneficiary',
                                        beneficiary?.name,
                                        entityId,
                                    );
                                    // eslint-disable-next-line no-alert
                                    alert('Entity edition');
                                }}
                                color="action"
                            />
                        </Box>
                    </Grid> */}
                </Grid>
                <Box mt={2}>
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
                                loading:
                                    isLoadingBeneficiary ||
                                    isLoadingSubmissions,
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
                </Box>
            </Box>
        </>
    );
};
