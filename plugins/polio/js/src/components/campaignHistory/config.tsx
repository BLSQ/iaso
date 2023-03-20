import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import { Box } from '@material-ui/core';
import MESSAGES from '../../constants/messages';
import { GeoJsonMap } from '../../../../../../hat/assets/js/apps/Iaso/components/maps/GeoJsonMapComponent';

const convertDate = (value: string, format = 'L') => {
    return value ? moment(value).format(format) : '--';
};
export const config: Record<string, any> = [
    {
        key: 'id',
    },
    {
        key: 'created_at',
        getLogValue: log => convertDate(log.created_at, 'LTS'),
    },
    {
        key: 'updated_at',
        getLogValue: log => convertDate(log.updated_at, 'LTS'),
    },
    {
        key: 'deleted_at',
        getLogValue: log => convertDate(log.deleted_at, 'LTS'),
    },
    {
        key: 'group',
    },
    {
        key: 'eomg',
    },
    {
        key: 'obr_name',
    },
    {
        key: 'gpei_email',
    },
    {
        key: 'rounds',
        type: 'array',
        childrenLabel: MESSAGES.round,
        children: [
            {
                key: 'id',
            },
            {
                key: 'cost',
            },
            {
                key: 'number',
            },
            {
                key: 'scopes',
                type: 'array',
                childrenLabel: MESSAGES.scope,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'group',
                        type: 'object',
                        childrenLabel: MESSAGES.group,
                        children: [
                            {
                                key: 'id',
                            },
                            {
                                key: 'org_units',
                                getLogValue: log =>
                                    log.org_units.map((ouId, index) => {
                                        const lastArrayItem =
                                            log.org_units[
                                                log.org_units.length - 1
                                            ];
                                        return (
                                            <Link
                                                target="_blank"
                                                href={`/dashboard/orgunits/detail/orgUnitId/${ouId}`}
                                            >
                                                {ouId}
                                                {log.org_units[index] !==
                                                    lastArrayItem && ','}
                                            </Link>
                                        );
                                    }),
                            },
                        ],
                    },
                ],
            },
            {
                key: 'campaign',
            },
            {
                key: 'ended_at',
                getLogValue: log => convertDate(log.ended_at),
            },
            {
                key: 'vaccines',
                type: 'array',
                childrenLabel: MESSAGES.vaccine,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'doses_per_vial',
                    },
                    {
                        key: 'name',
                    },
                    {
                        key: 'round',
                    },
                    {
                        key: 'wastage_ratio_forecast',
                    },
                ],
            },
            {
                key: 'shipments',
                type: 'array',
                childrenLabel: MESSAGES.shipment,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'round',
                    },
                    {
                        key: 'comment',
                    },
                    {
                        key: 'po_numbers',
                    },
                    {
                        key: 'vaccine_name',
                    },
                    {
                        key: 'date_reception',
                    },
                    {
                        key: 'vials_received',
                    },
                    {
                        key: 'reception_pre_alert',
                    },
                    {
                        key: 'estimated_arrival_date',
                    },
                ],
            },
            {
                key: 'forma_date',
            },
            {
                key: 'started_at',
                getLogValue: log => convertDate(log.started_at),
            },
            {
                key: 'im_ended_at',
                getLogValue: log => convertDate(log.im_ended_at),
            },
            {
                key: 'destructions',
                type: 'array',
                childrenLabel: MESSAGES.destruction,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'round',
                    },
                    {
                        key: 'comment',
                    },
                    {
                        key: 'destructionReportDate',
                        getLogValue: log => convertDate(log.date_report),
                    },
                    {
                        key: 'vials_destroyed',
                    },
                    {
                        key: 'destructionReceptionDate',
                        getLogValue: log =>
                            convertDate(log.date_report_received),
                    },
                ],
            },
            {
                key: 'forma_comment',
            },
            {
                key: 'im_started_at',
                getLogValue: log => convertDate(log.im_started_at),
            },
            {
                key: 'lqas_ended_at',
                getLogValue: log => convertDate(log.lqas_ended_at),
            },
            {
                key: 'doses_requested',
            },

            {
                key: 'forma_reception',
            },
            {
                key: 'lqas_started_at',
                getLogValue: log => convertDate(log.lqas_started_at),
            },
            {
                key: 'mop_up_ended_at',
                getLogValue: log => convertDate(log.mop_up_ended_at),
            },
            {
                key: 'vials_destroyed',
            },
            {
                key: 'mop_up_started_at',
                getLogValue: log => convertDate(log.mop_up_started_at),
            },
            {
                key: 'date_destruction',
            },
            {
                key: 'target_population',
            },
            {
                key: 'forma_usable_vials',
            },
            {
                key: 'forma_missing_vials',
            },
            {
                key: 'lqas_district_failing',
            },
            {
                key: 'lqas_district_passing',
            },
            {
                key: 'main_awareness_problem',
            },
            {
                key: 'date_signed_vrf_received',
            },
            {
                key: 'preparedness_spreadsheet_url',
            },
            {
                key: 'awareness_of_campaign_planning',
            },
            {
                key: 'reporting_delays_hc_to_district',
            },
            {
                key: 'reporting_delays_district_to_region',
            },
            {
                key: 'reporting_delays_region_to_national',
            },
            {
                key: 'im_percentage_children_missed_in_household',
            },
            {
                key: 'im_percentage_children_missed_out_household',
            },
        ],
    },
    {
        key: 'scopes',
        type: 'array',
        childrenLabel: MESSAGES.scope,
        children: [
            {
                key: 'id',
            },
            {
                key: 'group',
                type: 'object',
                childrenLabel: MESSAGES.group,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'org_units',
                        getLogValue: log =>
                            log.org_units.map((ouId, index) => {
                                const lastArrayItem =
                                    log.org_units[log.org_units.length - 1];
                                return (
                                    <Box key={ouId} display="inline-block">
                                        <Link
                                            target="_blank"
                                            href={`/dashboard/orgunits/detail/orgUnitId/${ouId}`}
                                        >
                                            {ouId}
                                        </Link>
                                        {log.org_units[index] !==
                                            lastArrayItem && ','}
                                    </Box>
                                );
                            }),
                    },
                ],
            },
        ],
    },
    {
        key: 'account',
    },
    {
        key: 'country',
        getLogValue: log => (
            <Link
                target="_blank"
                href={`/dashboard/or).its/detail/orgUnitId/${log.country}`}
            >
                {log.country}
            </Link>
        ),
    },
    {
        key: 'geojson',
        getLogValue: log => <GeoJsonMap geoJson={log.geojson} />,
    },
    {
        key: 'onset_at',
    },
    {
        key: 'description',
    },
    {
        key: 'payment_mode',
    },
    {
        key: 'budget_status',
    },
    {
        key: 'is_preventive',
    },
    {
        key: 'district_count',
    },
    {
        key: 'pv_notified_at',
        getLogValue: log => convertDate(log.pv_notified_at),
    },
    {
        key: 'doses_requested',
    },
    {
        key: 'pv2_notified_at',
        getLogValue: log => convertDate(log.pv2_notified_at),
    },
    {
        key: 'detection_status',
    },
    {
        key: 'dg_authorized_at',
        getLogValue: log => convertDate(log.dg_authorized_at),
    },
    {
        key: 'gpei_coordinator',
    },
    {
        key: 'initial_org_unit',
        getLogValue: log => (
            <Link
                target="_blank"
                href={`/dashboard/orgunits/detail/orgUnitId/${log.initial_org_unit}`}
            >
                {log.initial_org_unit}
            </Link>
        ),
    },
    {
        key: 'investigation_at',
        getLogValue: log => convertDate(log.investigation_at),
    },
    {
        key: 'cvdpv_notified_at',
        getLogValue: log => convertDate(log.cvdpv_notified_at),
    },
    {
        key: 'last_budget_event',
    },
    {
        key: 'budget_responsible',
    },
    {
        key: 'cvdpv2_notified_at',
        getLogValue: log => convertDate(log.cvdpv2_notified_at),
    },
    {
        key: 'verification_score',
    },
    {
        key: 'budget_submitted_at',
        getLogValue: log => convertDate(log.budget_submitted_at),
    },
    {
        key: 'three_level_call_at',
        getLogValue: log => convertDate(log.three_level_call_at),
    },
    {
        key: 'ag_nopv_group_met_at',
        getLogValue: log => convertDate(log.ag_nopv_group_met_at),
    },
    {
        key: 'detection_responsible',
    },
    {
        key: 'no_regret_fund_amount',
    },
    {
        key: 'surge_spreadsheet_url',
    },
    {
        key: 'approved',
        getLogValue: log => convertDate(log.approved),
    },
    {
        key: 'creation_email_send_at',
    },
    {
        key: 'risk_assessment_status',
    },
    {
        key: 'who_disbursed_to_co_at',
    },
    {
        key: 'enable_send_weekly_email',
    },
    {
        key: 'preperadness_sync_status',
    },
    {
        key: 'separate_scopes_per_round',
    },
    {
        key: 'unicef_disbursed_to_co_at',
        getLogValue: log =>
            convertDate(log.unicef_disbursed_to_co_at_WFEDITABLE),
    },
    {
        key: 'budget_current_state_label',
    },
    {
        key: 'risk_assessment_responsible',
    },
    {
        key: 'budget_rrt_oprtt_approval_at',
        getLogValue: log =>
            convertDate(log.budget_rrt_oprtt_approval_at_WFEDITABLE),
    },
    {
        key: 'preperadness_spreadsheet_url',
    },
    {
        key: 'approved_by_who',
        getLogValue: log => convertDate(log.approved_by_who_at_WFEDITABLE),
    },
    {
        key: 'who_sent_budget',
        getLogValue: log => convertDate(log.who_sent_budget_at_WFEDITABLE),
    },
    {
        key: 'budget_requested',
        getLogValue: log =>
            convertDate(log.budget_requested_at_WFEDITABLE, 'L'),
    },
    {
        key: 'submitted_to_rrt',
        getLogValue: log =>
            convertDate(log.submitted_to_rrt_at_WFEDITABLE, 'L'),
    },
    {
        key: 'submitted_to_orpg',
        getLogValue: log =>
            convertDate(log.submitted_to_orpg_at_WFEDITABLE, 'L'),
    },
    {
        key: 'detection_rrt_oprtt_approval_at',

        getLogValue: log =>
            convertDate(log.detection_rrt_oprtt_approval_at_WFEDITABLE, 'L'),
    },
    {
        key: 'gpei_consolidation',
        getLogValue: log =>
            convertDate(log.gpei_consolidation_at_WFEDITABLE, 'L'),
    },
    {
        key: 'unicef_sent_budget',
        getLogValue: log =>
            convertDate(log.unicef_sent_budget_at_WFEDITABLE, 'L'),
    },
    {
        key: 're_submitted_to_rrt',
        getLogValue: log =>
            convertDate(log.re_submitted_to_rrt_at_WFEDITABLE, 'L'),
    },
    {
        key: 'detection_first_draft_submitted_at',
        getLogValue: log =>
            convertDate(log.detection_first_draft_submitted_at_WFEDITABLE, 'L'),
    },
    {
        key: 're_submitted_to_orpg',
        getLogValue: log =>
            convertDate(log.re_submitted_to_orpg_at_WFEDITABLE, 'L'),
    },
    {
        key: 'feedback_sent_to_rrt1',
        getLogValue: log =>
            convertDate(log.feedback_sent_to_rrt1_at_WFEDITABLE, 'L'),
    },
    {
        key: 'feedback_sent_to_rrt2',
        getLogValue: log =>
            convertDate(log.feedback_sent_to_rrt2_at_WFEDITABLE, 'L'),
    },
    {
        key: 'feedback_sent_to_rrt3',
        getLogValue: log =>
            convertDate(log.feedback_sent_to_rrt3_at_WFEDITABLE, 'L'),
    },
    {
        key: 'submitted_for_approval',
        getLogValue: log =>
            convertDate(log.submitted_for_approval_at_WFEDITABLE, 'L'),
    },
    {
        key: 'risk_assessment_rrt_oprtt_approval_at',
        getLogValue: log =>
            convertDate(
                log.risk_assessment_rrt_oprtt_approval_at_WFEDITABLE,
                'L',
            ),
    },
    {
        key: 'risk_assessment_first_draft_submitted',
        getLogValue: log =>
            convertDate(
                log.risk_assessment_first_draft_submitted_at_WFEDITABLE,
                'L',
            ),
    },
    {
        key: 'submission_to_orpg_operations_1',
        getLogValue: log =>
            convertDate(log.submission_to_orpg_operations_1_at_WFEDITABLE, 'L'),
    },
    {
        key: 're_submission_to_orpg_operations_2',
        getLogValue: log =>
            convertDate(
                log.re_submission_to_orpg_operations_2_at_WFEDITABLE,
                'L',
            ),
    },
    {
        key: 'feedback_sent_to_orpg_operations_who',
        getLogValue: log =>
            convertDate(
                log.feedback_sent_to_orpg_operations_who_at_WFEDITABLE,
                'L',
            ),
    },
    {
        key: 'feedback_sent_to_orpg_operations_unicef',
        getLogValue: log =>
            convertDate(
                log.feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE,
                'L',
            ),
    },
];
