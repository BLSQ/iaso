/* eslint-disable react/require-default-props */
import { Skeleton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { commonStyles, IconButton, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { useGetFields } from '../hooks/useGetFields';
import { useGetBeneficiaryTypesDropdown } from '../hooks/requests';
import { baseUrls } from '../../../constants/urls';
import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { PossibleField } from '../../forms/types/forms';
import { BeneficiaryBaseInfoContents } from './BeneficiaryBaseInfoContents';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    beneficiary?: Beneficiary;
    withLinkToBeneficiary?: boolean;
};
export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
    withLinkToBeneficiary = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    const { data: beneficiaryTypes } = useGetBeneficiaryTypesDropdown();
    const { possibleFields } = useGetPossibleFields(
        beneficiary?.attributes?.form_id,
    );

    const detailFields = useMemo(() => {
        let fields = [];
        if (beneficiaryTypes && beneficiary) {
            const fullType = beneficiaryTypes.find(
                type => type.value === beneficiary.entity_type,
            );
            fields = fullType?.original?.fields_detail_info_view || [];
        }
        return fields;
    }, [beneficiaryTypes, beneficiary]);
    const dynamicFields: Field[] = useGetFields(
        detailFields,
        beneficiary,
        possibleFields,
    );
    const staticFields = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.nfcCards),
                value: `${beneficiary?.attributes?.nfc_cards ?? 0}`,
                key: 'nfcCards',
            },
            {
                label: formatMessage(MESSAGES.uuid),
                value: beneficiary?.uuid ? `${beneficiary.uuid}` : '--',
                key: 'uuid',
            },
        ],
        [beneficiary?.attributes?.nfc_cards, beneficiary?.uuid, formatMessage],
    );

    const isLoading =
        !beneficiary || detailFields.length !== dynamicFields.length;

    if (isLoading) {
        return (
            <>
                {[...Array(4)].map((_, i) => (
                    <Skeleton
                        key={i}
                        sx={{ marginBottom: theme => theme.spacing(2) }}
                        variant="rectangular"
                        width="100%"
                        height="5vh"
                    />
                ))}
            </>
        );
    } else {
        const widgetContents = (
            <BeneficiaryBaseInfoContents
                dynamicFields={dynamicFields}
                staticFields={staticFields}
            />
        );

        if (withLinkToBeneficiary) {
            return (
                <WidgetPaper
                    className={classes.infoPaper}
                    title={formatMessage(MESSAGES.beneficiaryInfo)}
                    IconButton={IconButton}
                    iconButtonProps={{
                        url: `/${baseUrls.entityDetails}/entityId/${beneficiary.id}`,
                        icon: 'remove-red-eye',
                        tooltipMessage: MESSAGES.see,
                    }}
                >
                    {widgetContents}
                </WidgetPaper>
            );
        } else {
            return (
                <WidgetPaper
                    className={classes.infoPaper}
                    title={formatMessage(MESSAGES.beneficiaryInfo)}
                >
                    {widgetContents}
                </WidgetPaper>
            );
        }
    }
};
