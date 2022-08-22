import moment from 'moment';

type Props = {
    ageType: '0' | '1';
    birthDate?: string;
    age?: string;
};

export const useGetAge = (props: Props): number | undefined => {
    const { ageType, age, birthDate } = props;
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
