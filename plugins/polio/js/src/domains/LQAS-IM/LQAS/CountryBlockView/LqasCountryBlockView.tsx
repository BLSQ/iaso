import React, { FunctionComponent } from 'react';
import { Side } from '../../../../constants/types';
import { Box } from '@mui/material';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { LqasCountryBlockFilter } from './LqasCountryBlockFilters';
import { LqasCountryBlockParams } from './LqasCountryBlock';

type Props = {
    side: Side;
    params: LqasCountryBlockParams;
};

const baseUrl = baseUrls.lqasCountryBlock;

export const LqasCountryBlockView: FunctionComponent<Props> = ({
    side,
    params,
}) => {
    const countryBlockId = (params[`${side}CountryBlock`] as string | undefined)
        ? parseInt(params[`${side}CountryBlock`] as string, 10)
        : undefined;
    const redirectToReplace = useRedirectToReplace();

    return (
        <>
            <Box>
                <LqasCountryBlockFilter side={side} params={params} />
                {/* <LqasCountryBlockDataView
                    params={params}
                    side={side}
                    countryBlockId={countryBlockId}
                    data={}
                    isFetching={isFetching}
                /> */}
            </Box>
        </>
    );
};
