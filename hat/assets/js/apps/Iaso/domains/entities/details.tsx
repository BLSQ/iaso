import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Button, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { redirectTo, redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';

import { Beneficiary } from './types/beneficiary';
import { useBeneficiariesDetailsColumns } from './config';
import { CsvButton } from '../../components/Buttons/CsvButton';
import { XlsxButton } from '../../components/Buttons/XslxButton';
import { BeneficiaryBaseInfo } from './components/BeneficiaryBaseInfo';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';

type Props = {
    router: any;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%' },
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { entityId } = params;
    const { formatMessage } = useSafeIntl();

    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();

    const {
        data: beneficiary,
        isLoading: isLoadingBeneficiary,
    }: {
        data?: Beneficiary;
        isLoading: boolean;
    } = useGetBeneficiary(entityId);
    const columns = useBeneficiariesDetailsColumns(beneficiary?.id ?? null, []);

    const { data, isLoading: isLoadingSubmissions } = useGetSubmissions(
        params,
        entityId,
    );

    const duplicates = useMemo(() => {
        return beneficiary?.duplicates ?? [];
    }, [beneficiary]);

    const onClickDuplicateButton = useCallback(() => {
        const duplicateUrl =
            duplicates.length === 1
                ? `${baseUrls.entityDuplicateDetails}/entities/${entityId},${duplicates[0]}/`
                : `${baseUrls.entityDuplicates}/order/id/pageSize/50/page/1/entity_id/${entityId}/`;
        dispatch(redirectTo(duplicateUrl));
    }, [dispatch, duplicates, entityId]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.beneficiary)}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.entities, {}));
                    }
                }}
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
                                <Link>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={onClickDuplicateButton}
                                    >
                                        {formatMessage(MESSAGES.seeDuplicates)}
                                    </Button>
                                </Link>
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
                            onTableParamsChange={p =>
                                dispatch(
                                    redirectToReplace(
                                        baseUrls.entityDetails,
                                        p,
                                    ),
                                )
                            }
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
