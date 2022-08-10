import moment from 'moment';

export const useGetAge = (
    birthDate: string | undefined,
): number | undefined => {
    const today = moment();
    if (!birthDate) {
        return undefined;
    }
    return today.diff(moment(birthDate), 'years');
};
