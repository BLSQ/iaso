// DatesRange.d.ts
import { ComponentType } from 'react';
import { IntlShape } from 'react-intl';

interface DatesRangeProps {
    dateFrom?: string;
    dateTo?: string;
    onChangeDate: (key: string, value: any) => void;
    labelTo?: { id: string; defaultMessage: string };
    labelFrom?: { id: string; defaultMessage: string };
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    keyDateFrom?: string;
    keyDateTo?: string;
    errors?: any[];
    blockInvalidDates?: boolean;
    marginTop?: number;
    dateFromRequired?: boolean;
    dateToRequired?: boolean;
}

declare const DatesRange: ComponentType<DatesRangeProps>;

export default DatesRange;
