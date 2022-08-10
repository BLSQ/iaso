import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';

import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { useGetBeneficiary } from './hooks/requests';

import { Beneficiary } from './types/beneficiary';

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

    const {
        data: beneficiary,
        isLoading: isLoadingBeneficiary,
    }: {
        data?: Beneficiary;
        isLoading: boolean;
    } = useGetBeneficiary(beneficiaryId);
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
                {beneficiary && beneficiary.name}
                {beneficiary &&
                    JSON.stringify(beneficiary.attributes?.file_content)}
            </Box>
        </>
    );
};
