import React, { FunctionComponent, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getPrefixedParams } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/common';
import { baseUrls } from '../../../../constants/urls';
import { VaccineRepositoryParams } from '../types';
import { Filters } from './Filters';

type Props = {
    params: VaccineRepositoryParams;
};

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

export const Reports: FunctionComponent<Props> = ({ params }) => {
    const reportParams = useMemo(
        () => getPrefixedParams('report', params),
        [params],
    );
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const redirectUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;
    return (
        <>
            <Filters params={reportParams} redirectUrl={redirectUrl} />
            TABLE
        </>
    );
};
