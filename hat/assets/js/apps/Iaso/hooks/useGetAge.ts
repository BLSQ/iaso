import moment from 'moment';
import { useMemo } from 'react';

type Props = {
    // age '0' is when the user input a birth date, age '1' when they gave an age (in months)
    ageType?: '0' | '1';
    birthDate?: string;
    age?: string;
};

export const getAge = ({
    ageType,
    age,
    birthDate,
}: Props): number | undefined => {
    if (ageType === '0') {
        const today = moment();
        if (!birthDate) {
            return undefined;
        }
        return today.diff(moment(birthDate), 'months');
    }
    if (ageType === '1') {
        if (!age) return undefined;
        return parseInt(age, 10);
    }
    return undefined;
};

export const useGetAge = (props: Props): number | undefined => {
    const { ageType, age, birthDate } = props;
    return useMemo(() => {
        return getAge({ ageType, age, birthDate });
    }, [age, ageType, birthDate]);
};
