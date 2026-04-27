export type FormAFormValues = {
    id?: number;
    status: string;
    campaign?: string;
    round?: number;
    report_date?: string;
    form_a_reception_date?: string;
    usable_vials_used?: number;
    doses_per_vial: number;
    vaccine_stock: string;
    file?: File[] | string;
    comment: string | null;
    alternative_campaign: string | null;
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
