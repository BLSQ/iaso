import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    Table,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';

import { Beneficiary } from './types/beneficiary';
import { useResetPageToOne } from '../../../hooks/useResetPageToOne';
import { useBeneficiariesDetailsColumns } from './config';
import { CsvButton } from '../../../components/Buttons/CsvButton';
import { XlsxButton } from '../../../components/Buttons/XslxButton';

type Props = {
    router: any;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    // @ts-ignore
    allBorders: { border: `1px solid ${theme.palette.mediumGray.main}` },
    allButTopBorder: {
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        borderTop: 'none',
    },
    allButBottomBorder: {
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        borderBottom: 'none',
    },
    allButLeftBorder: {
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        borderLeft: 'none',
    },
    BottomAndRightBorders: {
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        borderLeft: 'none',
        borderTop: 'none',
    },
    titleRow: { fontWeight: 'bold' },
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { beneficiaryId } = params;
    const { formatMessage } = useSafeIntl();

    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();
    const resetPageToOne = useResetPageToOne({ params });

    const {
        data: beneficiary,
        isLoading: isLoadingBeneficiary,
    }: {
        data?: Beneficiary;
        isLoading: boolean;
    } = useGetBeneficiary(beneficiaryId);
    const columns = useBeneficiariesDetailsColumns(
        // @ts-ignore
        beneficiary?.entity_type?.fields_detail_view,
    );

    const { data: submissions, isLoading: isLoadingSubmissions } =
        useGetSubmissions(beneficiaryId);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.beneficiary)}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.beneficiaries, {}));
                    }
                }}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isLoadingBeneficiary && <LoadingSpinner />}
                <Grid container>
                    <Grid container item xs={3}>
                        <Grid container item xs={12}>
                            <Grid
                                container
                                item
                                xs={6}
                                className={`${classes.allBorders} ${classes.titleRow}`}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {formatMessage(MESSAGES.name)}
                                </Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                className={classes.allButLeftBorder}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {beneficiary?.attributes.file_content.name}
                                </Box>
                            </Grid>
                        </Grid>
                        {/* <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                className={`${classes.allButTopBorder} ${classes.titleRow}`}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {formatMessage(MESSAGES.lastName)}
                                </Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                className={classes.BottomAndRightBorders}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    Whatever
                                </Box>
                            </Grid>
                        </Grid> */}
                        <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                className={`${classes.allButTopBorder} ${classes.titleRow}`}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {formatMessage(MESSAGES.age)}
                                </Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                className={classes.BottomAndRightBorders}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {beneficiary?.attributes.file_content.age}
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                className={`${classes.allButTopBorder} ${classes.titleRow}`}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {formatMessage(MESSAGES.gender)}
                                </Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                className={classes.BottomAndRightBorders}
                                justifyContent="center"
                            >
                                <Box mt={1} mb={1}>
                                    {beneficiary?.attributes.file_content
                                        .gender ??
                                        formatMessage(MESSAGES.unknown)}
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid container item xs={1}>
                        <Box ml={2}>
                            <EditIcon
                                onClick={() => {
                                    console.log(
                                        'Edit Beneficiary',
                                        beneficiary?.name,
                                        beneficiaryId,
                                    );
                                    alert('Entity edition, coming soon');
                                }}
                                color="action"
                            />
                        </Box>
                    </Grid>
                    <Grid container item xs={3} justifyContent="center">
                        <Box mt={1}>
                            {`${formatMessage(MESSAGES.nfcCards)}: ${
                                // TODO update when nfc data is available from backend
                                // @ts-ignore
                                beneficiary?.attributes.nfc_cards ?? 0
                            }`}
                        </Box>
                    </Grid>
                    <Grid container item xs={5} justifyContent="flex-end">
                        <Box mr={2}>
                            <CsvButton
                                csvUrl={`/api/entity/beneficiary/?csv=true&id=${beneficiaryId}`}
                            />
                        </Box>
                        <Box>
                            <XlsxButton
                                xlsxUrl={`/api/entity/beneficiary/?xlsx=true&id=${beneficiaryId}`}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Box mt={2}>{beneficiary?.uuid}</Box>
                <Table
                    data={submissions ?? []}
                    columns={columns}
                    resetPageToOne={resetPageToOne}
                    count={1}
                    pages={1}
                    params={params}
                    extraProps={{
                        colums: columns,
                        loading: isLoadingBeneficiary || isLoadingSubmissions,
                    }}
                />
            </Box>
        </>
    );
};
