import { Theme } from '@mui/material/styles';
import moment from 'moment';

// Colors of the nutrition programmes
export const programmeColor = (
    theme: Theme,
    programme?: string | null,
): string | undefined => {
    switch (programme) {
        case 'BSFP':
            return theme.palette.primary.main;
        case 'NSEP':
            return '#00838f';
        case 'TSFP':
            return '#ef6c00';
        case 'OTP':
        case 'OTP - Under 6':
            return theme.palette.error.main;
        default:
            return undefined;
    }
};

// MUAC thresholds: women (PLW) are malnourished under 23 cm, children under 12.5 (severely under 11.5)
export const muacColor = (
    theme: Theme,
    muac: number,
    programmeType?: string | null,
): string => {
    if (programmeType === 'PLW') {
        return muac >= 23
            ? theme.palette.success.main
            : theme.palette.error.main;
    }
    if (muac >= 12.5) return theme.palette.success.main;
    if (muac >= 11.5) return '#fbc02d';
    return theme.palette.error.main;
};

export const formatDate = (value?: string | null): string =>
    value ? moment(value).format('YYYY-MM-DD') : '';

export const whzColor = (theme: Theme, color?: string | null): string => {
    switch (color) {
        case 'Green':
            return theme.palette.success.main;
        case 'Yellow':
            return theme.palette.yellow.main;
        case 'Red':
            return theme.palette.error.main;
        default:
            return theme.palette.grey[500];
    }
};

const BAD_EXITS = ['death', 'defaulter', 'non_respondent'];
export const exitColor = (theme: Theme, exitType: string): string => {
    if (exitType === 'cured') return theme.palette.success.main;
    if (BAD_EXITS.includes(exitType)) return theme.palette.error.main;
    if (exitType.includes('transfer')) return theme.palette.primary.main;
    return theme.palette.warning.main;
};
