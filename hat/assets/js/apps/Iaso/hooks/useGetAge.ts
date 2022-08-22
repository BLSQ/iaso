import moment from 'moment';
import { useMemo } from 'react';

type Props = {
    ageType: '0' | '1';
    birthDate?: string;
    age?: string;
};

export const useGetAge = (props: Props): number | undefined => {
    const { ageType, age, birthDate } = props;
    return useMemo(() => {
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
    }, [age, ageType, birthDate]);
};
