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
    /** Hide temporary/received toggle when a regular Form A is past the edit window (transition blocked server-side). */
    showTemporaryStatusField: boolean;
    canEditCampaignAndRound: boolean;
    canEditReportDate: boolean;
    canEditReceptionDate: boolean;
    canEditVials: boolean;
    canEditDosesPerVial: boolean;
    canEditComment: boolean;
    canEditFile: boolean;
};

/** List/table row from Form A outgoing stock movement API */
export type FormATableRow = Record<string, unknown> & {
    id?: number;
    vaccine_stock?: string;
    campaign?: string | null;
    alternative_campaign?: string | null;
    campaign_category?: string;
    round_number?: number | null;
    status?: string;
    usable_vials_used?: number | null;
    doses_per_vial?: number | null;
    file?: File[] | string | null;
    scan_result?: unknown;
    scan_timestamp?: string | number | null;
    edit_access?: FormAEditAccess;
};

/** List/table row from destruction report API */
export type DestructionTableRow = Record<string, unknown> & {
    id?: number;
    vaccine_stock?: string;
    unusable_vials_destroyed?: number | null;
    doses_per_vial?: number | null;
    file?: File[] | string | null;
    scan_result?: unknown;
    scan_timestamp?: string | number | null;
    can_edit?: boolean;
};

/** List/table row from incident report API */
export type IncidentTableRow = Record<string, unknown> & {
    id?: number;
    vaccine_stock?: string;
    stock_correction?: string | null;
    usable_vials?: number | null;
    unusable_vials?: number | null;
    doses_per_vial?: number | null;
    file?: File[] | string | null;
    scan_result?: unknown;
    scan_timestamp?: string | number | null;
    can_edit?: boolean;
};

/** List/table row from earmarked stock API */
export type EarmarkedTableRow = Record<string, unknown> & {
    id?: number;
    vaccine_stock?: string;
    earmarked_stock_type?: string | null;
    campaign?: string | null;
    temporary_campaign_name?: string | null;
    campaign_category?: string;
    round_number?: number | null;
    vials_earmarked?: number | null;
    doses_earmarked?: number | null;
    doses_per_vial?: number | null;
    can_edit?: boolean;
};
