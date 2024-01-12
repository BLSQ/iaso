/* eslint-disable react/require-default-props */
import { Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { useGetFields } from '../hooks/useGetFields';
import { useGetBeneficiaryTypesDropdown } from '../hooks/requests';

import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { PaperTableRow } from '../../../components/tables/PaperTableRow';

type Props = {
    beneficiary?: Beneficiary;
};
export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: types } = useGetBeneficiaryTypesDropdown();
    const { possibleFields, isFetchingForm } = useGetPossibleFields(
        beneficiary?.attributes?.form_id,
    );
    const detailFields = useMemo(() => {
        let fields = [];
        if (types && beneficiary) {
            const fullType = types.find(
                type => type.value === beneficiary.entity_type,
            );
            fields = fullType?.original?.fields_detail_info_view || [];
        }
        return fields;
    }, [types, beneficiary]);
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
    return (
        <>
            <Table size="small">
                <TableBody>
                    {!isFetchingForm && beneficiary && (
                        <>
                            {dynamicFields.map(field => (
                                <PaperTableRow
                                    label={field.label}
                                    value={field.value}
                                    key={field.key}
                                />
                            ))}
                            {staticFields.map(field => (
                                <PaperTableRow
                                    label={field.label}
                                    value={field.value}
                                    key={field.key}
                                />
                            ))}
                        </>
                    )}
                </TableBody>
            </Table>
        </>
    );
};
