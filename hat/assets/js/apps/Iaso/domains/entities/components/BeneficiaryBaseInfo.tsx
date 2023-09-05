/* eslint-disable react/require-default-props */
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { useGetFields } from '../hooks/useGetFields';
import { useGetBeneficiaryTypesDropdown } from '../hooks/requests';

import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

type RowProps = {
    field: Field;
};

const Row: FunctionComponent<RowProps> = ({ field }) => {
    const { label, value } = field;
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

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
                                <Row field={field} key={field.key} />
                            ))}
                            {staticFields.map(field => (
                                <Row field={field} key={field.key} />
                            ))}
                        </>
                    )}
                </TableBody>
            </Table>
        </>
    );
};
