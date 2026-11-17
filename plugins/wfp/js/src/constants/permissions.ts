import { defineMessages } from 'react-intl';

export const WFP_BENEFICIARY_EXPORT = 'iaso_wfp_beneficiary_export';

export const permissionsMessages = defineMessages({
    [WFP_BENEFICIARY_EXPORT]: {
        id: 'iaso.permissions.iaso_wfp_beneficiary_export',
        defaultMessage: 'Export WFP beneficiaries',
    },
    [`${WFP_BENEFICIARY_EXPORT}_tooltip`]: {
        id: 'iaso.permissions.iaso_wfp_beneficiary_export_tooltip',
        defaultMessage:
            'Allows to see the beneficiaries computed by the WFP ETL and to export them (CODA 2.0 and raw data). Personal data is only exported with the permission to view it',
    },
});
