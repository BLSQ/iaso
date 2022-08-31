/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { useGetAge } from '../../../../../hooks/useGetAge';
import { Beneficiary } from '../../types/beneficiary';

import { IntlFormatMessage } from '../../../../../types/intl';
import MESSAGES from '../../../messages';

type Props = {
    beneficiary?: Beneficiary;
};

export const Age: FunctionComponent<Props> = ({ beneficiary }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const result = useGetAge({
        ageType: beneficiary?.attributes?.file_content.age_type,
        age: beneficiary?.attributes?.file_content.age,
        birthDate: beneficiary?.attributes?.file_content.birth_date,
    });
    if (!result && typeof result !== 'number') return <>--</>;
    return <>{`${result} ${formatMessage(MESSAGES.months)}`}</>;
};
