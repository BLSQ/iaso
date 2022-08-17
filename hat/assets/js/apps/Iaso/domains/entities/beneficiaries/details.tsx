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

import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';

import { Beneficiary } from './types/beneficiary';
import { useResetPageToOne } from '../../../hooks/useResetPageToOne';
import { useBeneficiariesDetailsColumns } from './config';

type Props = {
    router: any;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
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
                                style={{
                                    border: '1px solid black',
                                    fontWeight: 'bold',
                                }}
                                justifyContent="center"
                            >
                                First name
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{ border: '1px solid black' }}
                                justifyContent="center"
                            >
                                Whatever
                            </Grid>
                        </Grid>
                        <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{
                                    border: '1px solid black',
                                    fontWeight: 'bold',
                                }}
                                justifyContent="center"
                            >
                                <Box>Last name</Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{ border: '1px solid black' }}
                                justifyContent="center"
                            >
                                <Box>Whatever</Box>
                            </Grid>
                        </Grid>
                        <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{
                                    border: '1px solid black',
                                    fontWeight: 'bold',
                                }}
                                justifyContent="center"
                            >
                                <Box>Age</Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{ border: '1px solid black' }}
                                justifyContent="center"
                            >
                                <Box>12</Box>
                            </Grid>
                        </Grid>
                        <Grid container item xs={12}>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{
                                    border: '1px solid black',
                                    fontWeight: 'bold',
                                }}
                                justifyContent="center"
                            >
                                <Box>Gender</Box>
                            </Grid>
                            <Grid
                                item
                                container
                                xs={6}
                                style={{ border: '1px solid black' }}
                                justifyContent="center"
                            >
                                <Box>Female</Box>
                            </Grid>
                        </Grid>
                    </Grid>
                    <span>Icon</span>
                </Grid>
                <span>{beneficiary?.uuid}</span>
                <Table
                    data={submissions}
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
