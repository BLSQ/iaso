/* eslint-disable camelcase */
import React from 'react';
import { FormikProps } from 'formik';
import { UseMutateAsyncFunction } from 'react-query';
import { Vaccine } from '../../../constants/types';
import {
    DropdownOptions,
    Optional,
} from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';

export type TabValue = 'vrf' | 'arrival_reports' | 'pre_alerts';

export type VRF = {
    id?: number;
    country_name: string;
    country_id: number;
    campaign: string; // obr_name
    obr_name: string;
    vaccine_type: Vaccine;
    rounds: { number: number }[];
    date_vrf_signature: string; // date in string form
    quantities_ordered_in_doses: number;
    wastage_rate_used_on_vrf: number;
    date_vrf_reception: string; // date in string form
    date_vrf_submission_orpg?: string; // date in string form
    quantities_approved_by_orpg_in_doses?: number;
    date_rrt_orpg_approval?: string; // date in string form
    date_vrf_submitted_to_dg?: string; // date in string form
    quantities_approved_by_dg_in_doses?: number;
    date_dg_approval?: string; // date in string form
    comments?: string;
};

export type VRFFormData = Omit<VRF, 'rounds'> & {
    rounds: number[]; // 1,2
};

export type PreAlert = {
    id?: number;
    date_reception: string; // date in string form
    po_number: string;
    eta: string;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_received: number;
    doses_per_vial: number;
    vials_shipped: number;
    to_delete?: boolean;
};

export type VAR = {
    id?: number;
    report_date: string; // date in string form
    po_number: number;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_received: number;
    doses_per_vial: number;
    vials_shipped: number;
    vials_received: number;
    to_delete?: boolean;
};

export type SupplyChainFormData = {
    vrf: Optional<Partial<VRFFormData>>;
    pre_alerts: Optional<Partial<PreAlert>[]>;
    arrival_reports: Optional<Partial<VAR>[]>;
    activeTab: TabValue;
    saveAll: boolean;
    changedTabs: TabValue[];
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
    router: Router;
    initialValues: SupplyChainFormData;
    setInitialValues: React.Dispatch<SupplyChainFormData>;
    saveForm: UseMutateAsyncFunction<any, any, unknown, unknown>;
    // eslint-disable-next-line no-unused-vars
    redirect: (url: string, options: Record<string, string>) => void;
};
