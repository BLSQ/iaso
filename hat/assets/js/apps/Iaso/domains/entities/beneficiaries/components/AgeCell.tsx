/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { useGetAge } from '../../../../hooks/useGetAge';

import { IntlFormatMessage } from '../../../../types/intl';
import MESSAGES from '../messages';

type Props = {
    ageType: '0' | '1';
    birthDate?: string;
    age?: string;
};

export const AgeCell: FunctionComponent<Props> = ({
    ageType,
    age,
    birthDate,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const result = useGetAge({
        ageType,
        age,
        birthDate,
    });
    if (!result && typeof result !== 'number') return <>--</>;
    return <>{`${result} ${formatMessage(MESSAGES.months)}`}</>;
};
