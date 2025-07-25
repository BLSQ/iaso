import { FormikProps } from 'formik';
import React from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import {
    DropdownOptions,
    Optional,
} from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Vaccine } from '../../../constants/types';

export type ScanResultStatus = 'CLEAN' | 'INFECTED' | 'ERROR' | 'PENDING';

export type TabValue = 'vrf' | 'arrival_reports' | 'pre_alerts';

export type VRF = {
    id?: number;
    country_name: string;
    country_id: number;
    campaign: string; // obr_name
    obr_name: string;
    vaccine_type: Vaccine;
    created_at: string; // date in string form
    rounds: { number: number }[];
    date_vrf_signature: string; // date in string form
    quantities_ordered_in_doses?: number;
    wastage_rate_used_on_vrf: number | string;
    date_vrf_reception: string; // date in string form
    date_vrf_submission_orpg?: string; // date in string form
    quantities_approved_by_orpg_in_doses?: number;
    date_rrt_orpg_approval?: string; // date in string form
    date_vrf_submitted_to_dg?: string; // date in string form
    quantities_approved_by_dg_in_doses?: number;
    date_dg_approval?: string; // date in string form
    target_population?: number;
    comments?: string;
    vrf_type: 'Normal' | 'Missing' | 'Not Required';
    file?: File;
};

export type VRFFormData = Omit<VRF, 'rounds'> & {
    rounds: number[]; // 1,2
};

export type PreAlert = {
    id?: number;
    date_pre_alert_reception: string; // date in string form
    po_number: string;
    eta: string;
    doses_shipped: number | string;
    doses_received: number | string;
    doses_per_vial: number;
    vials_shipped: number;
    to_delete?: boolean;
    file?: File;
    can_edit: boolean;
    scan_result?: ScanResultStatus;
    scan_timestamp?: number;
};

export type VAR = {
    id?: number;
    report_date: string; // date in string form
    po_number: number;
    doses_shipped: number | string;
    doses_received: number | string;
    doses_per_vial: number;
    vials_shipped: number;
    vials_received: number;
    to_delete?: boolean;
    can_edit: boolean;
};

export type SupplyChainFormData = {
    vrf: Optional<Partial<VRF>>;
    pre_alerts: Optional<Partial<PreAlert>[]>;
    arrival_reports: Optional<Partial<VAR>[]>;
    activeTab: TabValue;
    saveAll: boolean;
    changedTabs: TabValue[];
};

export type SupplyChainList = {
    id: number;
    country: { name: string; id: number };
    created_at: string;
    doses_shipped: number;
    doses_received: number;
    end_date: string;
    obr_name: string;
    po_numbers: string;
    quantities_ordered_in_doses: number;
    rounds: { id: number; number: number }[];
    start_date: string;
    updated_at: string;
    vaccine_type: string;
    var: string;
    can_edit: boolean;
};

export type ParsedSettledPromise<T> = {
    status: 'fulfilled' | 'rejected';
    value: T; // if success: api response, if failure: error message
};

export type SupplyChainResponse = {
    vrf?: ParsedSettledPromise<VRF>[];
    pre_alerts?: ParsedSettledPromise<PreAlert>[];
    arrival_reports?: ParsedSettledPromise<VAR>[];
};

export type CampaignDropdowns = {
    campaigns: DropdownOptions<string>[];
    vaccines: DropdownOptions<string>[];
    rounds: DropdownOptions<string>[];
    isFetching: boolean;
};

export type UseHandleSubmitArgs = {
    formik: FormikProps<SupplyChainFormData>;
    params: { id?: string };
    initialValues: SupplyChainFormData;
    setInitialValues: React.Dispatch<SupplyChainFormData>;
    saveForm: UseMutateAsyncFunction<any, any, unknown, unknown>;
    redirect: (url: string, options: Record<string, string>) => void;
};
