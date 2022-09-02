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
import { Box, Divider, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from '../messages';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { useGetBeneficiary, useGetSubmissions } from './hooks/requests';

import { Beneficiary } from './types/beneficiary';
import { useResetPageToOne } from '../../../hooks/useResetPageToOne';
import { useBeneficiariesDetailsColumns } from './config';
import { CsvButton } from '../../../components/Buttons/CsvButton';
import { XlsxButton } from '../../../components/Buttons/XslxButton';
import { BeneficiaryBaseInfo } from './components/BeneficiaryBaseInfo';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';

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
    fullWith: { width: '100%' },
}));

// const mapFileContent = (
//     fileContent?: Record<string, string>,
// ): ReactElement | null => {
//     if (!fileContent) return null;
//     const keys = Object.keys(fileContent);
//     return keys.map(key => {
//         return <Grid container item xs={12}></Grid>;
//     });
// };

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { entityId } = params;
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
    } = useGetBeneficiary(entityId);
    const columns = useBeneficiariesDetailsColumns(
        // @ts-ignore
        // beneficiary?.entity_type?.fields_detail_info_view ?? [],
        [],
    );
    // Code to format table by looping through form to avoid hard coding values
    // TODO Handle dates (as all values are displayed as strings)
    // const mapFileContent = useCallback(
    //     (fileContent?: Record<string, string>): ReactElement | null => {
    //         if (!fileContent) return null;
    //         const keys = Object.keys(fileContent);
    //         const rows = keys.map((key, i) => {
    //             const leftCellBorder =
    //                 i === 0 ? classes.allBorders : classes.allButTopBorder;
    //             const rightCellBorder =
    //                 i === 0
    //                     ? classes.allButLeftBorder
    //                     : classes.BottomAndRightBorders;
    //             return (
    //                 // eslint-disable-next-line react/no-array-index-key
    //                 <Grid container item xs={12} key={`${key}-${i}`}>
    //                     <Grid
    //                         container
    //                         item
    //                         xs={6}
    //                         className={`${leftCellBorder} ${classes.titleRow}`}
    //                         justifyContent="center"
    //                     >
    //                         <Box mt={1} mb={1}>
    //                             {key}
    //                         </Box>
    //                     </Grid>
    //                     <Grid
    //                         item
    //                         container
    //                         xs={6}
    //                         className={rightCellBorder}
    //                         justifyContent="center"
    //                     >
    //                         <Box mt={1} mb={1} style={{ textAlign: 'center' }}>
    //                             {/* TODO handle dates */}
    //                             {fileContent[key]}
    //                         </Box>
    //                     </Grid>
    //                 </Grid>
    //             );
    //         });
    //         return <>{rows}</>;
    //     },
    //     [
    //         classes.BottomAndRightBorders,
    //         classes.allBorders,
    //         classes.allButLeftBorder,
    //         classes.allButTopBorder,
    //         classes.titleRow,
    //     ],
    // );

    const { data: submissions, isLoading: isLoadingSubmissions } =
        useGetSubmissions(entityId);
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
                {isLoadingBeneficiary && <LoadingSpinner />}
                <Grid container spacing={2}>
                    {/* TODO uncomment when we can extract key translation from form */}
                    {/* <Grid container item xs={3}>
                        {mapFileContent(beneficiary?.attributes?.file_content)}
                    </Grid> */}
                    <Grid container item xs={4}>
                        <WidgetPaper
                            className={classes.fullWith}
                            title={formatMessage(MESSAGES.beneficiaryInfo)}
                        >
                            <BeneficiaryBaseInfo beneficiary={beneficiary} />
                        </WidgetPaper>
                    </Grid>
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
                        className={classes.fullWith}
                        title={formatMessage(MESSAGES.submissions)}
                    >
                        <Table
                            elevation={0}
                            data={submissions ?? []}
                            columns={columns}
                            resetPageToOne={resetPageToOne}
                            count={1}
                            pages={1}
                            params={params}
                            marginBottom={false}
                            marginTop={false}
                            countOnTop={false}
                            extraProps={{
                                colums: columns,
                                loading:
                                    isLoadingBeneficiary ||
                                    isLoadingSubmissions,
                            }}
                        />
                        <Divider />
                        <Box display="flex" py={2}>
                            <CsvButton
                                csvUrl={`/api/entity/beneficiary/?csv=true&id=${entityId}`}
                            />
                            <XlsxButton
                                xlsxUrl={`/api/entity/beneficiary/?xlsx=true&id=${entityId}`}
                            />
                        </Box>
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
