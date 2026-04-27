import {
    EDIT_ACCESS_COMPLETION_ONLY,
    EDIT_ACCESS_FULL,
    EDIT_ACCESS_NONE,
} from '../constants';

export type FormAEditAccess =
    | typeof EDIT_ACCESS_NONE
    | typeof EDIT_ACCESS_COMPLETION_ONLY
    | typeof EDIT_ACCESS_FULL;

export type FormAFormValues = {
    id?: number;
    status: string;
    campaign?: string;
    round?: number;
    report_date?: string;
    form_a_reception_date?: string | null;
    usable_vials_used?: number;
    doses_per_vial: number;
    vaccine_stock: string;
    file?: File[] | string;
    comment?: string | null;
    alternative_campaign?: string | null;
};

export type FormAUiState = {
    isTemporary: boolean;
    canEditStatus: boolean;
    canEditCampaignAndRound: boolean;
    canEditReportDate: boolean;
    canEditReceptionDate: boolean;
    canEditVials: boolean;
    canEditDosesPerVial: boolean;
    canEditComment: boolean;
    canEditFile: boolean;
};
