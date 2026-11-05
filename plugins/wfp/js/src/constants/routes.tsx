import React from 'react';
import { RoutePath } from 'Iaso/constants/routes';
import { Beneficiaries } from '../domains/beneficiaries';
import { WFP_BENEFICIARY_EXPORT } from './permissions';
import { baseUrls } from './urls';

export const wfpBeneficiariesPath: RoutePath = {
    baseUrl: baseUrls.wfpBeneficiaries,
    routerUrl: `${baseUrls.wfpBeneficiaries}/*`,
    element: <Beneficiaries />,
    permissions: [WFP_BENEFICIARY_EXPORT],
};

export const routes: RoutePath[] = [wfpBeneficiariesPath];
