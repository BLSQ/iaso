import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { determineSeparatorsFromLocale } from '../utils/dataManipulation';

export const useNumberSeparatorsFromLocale = (): {
    thousand: '.' | ',';
    decimal: '.' | ',';
} => {
    // @ts-ignore
    const activeLocale = useSelector(state => state.app.locale);
    return useMemo(
        () => determineSeparatorsFromLocale(activeLocale),
        [activeLocale],
    );
};
