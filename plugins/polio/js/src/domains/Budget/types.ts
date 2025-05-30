import {
    Nullable,
    Optional,
} from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { PaymentMode } from '../../constants/types';

export type Timeline = {
    categories: Categories;
};
export type Params = {
    budgetProcessId: string;
    previousStep?: string;
    quickTransition?: string;
    campaignName?: string;
    page?: string;
    order?: string;
    pageSize?: string;
};

export type Item = {
    label: string;
    step_id?: number;
    cancelled?: boolean;
    skipped?: boolean;
    performed_at?: string; // datetime
    performed_by?: {
        username;
        first_name;
        last_name;
    };
};

export type Categories = {
    key: string;
    label: string;
    color: string; // css string
    active: boolean;
    completed: boolean;
    items: Item[];
}[];

export type Transition = {
    key: string;
    label: string;
    color: Nullable<'primary' | 'green' | 'red'>;
    allowed: boolean; // depends on the user's team
    reason_not_allowed: Nullable<string>;
    required_fields: string[]; // comment, file, links
    help_text: string;
    emails_destination_team_ids?: number[];
    displayed_fields: string[]; // This field determines the columns shown in the "create" modal
};

export type Round = {
    id: number;
    value?: number;
    label?: string;
    number: string;
    target_population?: number;
    cost: string;
};

export type Budget = {
    id: number;
    obr_name: string;
    campaign_id: string;
    country_name: string;
    current_state: {
        key: string;
        label: string;
    };
    // -> optional: need to pass a param for the API to return it
    next_transitions?: Transition[];
    // -> optional: need to pass a param for the API to return it
    possible_states?: {
        key: string;
        label: string;
    }[];
    // -> optional: need to pass a param for the API to return it
    possible_transitions?: {
        key: string;
        label: string;
    }[];
    rounds?: Round[];
    timeline?: Timeline;
};
type BudgetState = {
    key: string;
    label: string;
};
export type BudgetDetail = {
    id: number;
    rounds: Round[];
    campaign_id: string;
    has_data_in_budget_tool: boolean;
    current_state_key: string;
    current_state: BudgetState;
    district_count?: number;
    no_regret_fund_amount?: number;
    payment_mode?: PaymentMode;
    ra_completed_at_WFEDITABLE?: string;
    who_sent_budget_at_WFEDITABLE?: string;
    unicef_sent_budget_at_WFEDITABLE?: string;
    gpei_consolidated_budgets_at_WFEDITABLE?: string;
    submitted_to_rrt_at_WFEDITABLE?: string;
    feedback_sent_to_gpei_at_WFEDITABLE?: string;
    re_submitted_to_rrt_at_WFEDITABLE?: string;
    submitted_to_orpg_operations1_at_WFEDITABLE?: string;
    feedback_sent_to_rrt1_at_WFEDITABLE?: string;
    re_submitted_to_orpg_operations1_at_WFEDITABLE?: string;
    submitted_to_orpg_wider_at_WFEDITABLE?: string;
    submitted_to_orpg_operations2_at_WFEDITABLE?: string;
    feedback_sent_to_rrt2_at_WFEDITABLE?: string;
    re_submitted_to_orpg_operations2_at_WFEDITABLE?: string;
    submitted_for_approval_at_WFEDITABLE?: string;
    feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE?: string;
    feedback_sent_to_orpg_operations_who_at_WFEDITABLE?: string;
    approved_by_who_at_WFEDITABLE?: string;
    approved_by_unicef_at_WFEDITABLE?: string;
    approved_at_WFEDITABLE?: string;
    approval_confirmed_at_WFEDITABLE?: string;
};
export type LinkWithAlias = { alias: string; url: string };

export type FileWithName = {
    file: string;
    filename: string;
    permanent_url: string;
};

export type BudgetStep = {
    id: number;
    created_at: string; // Date in string form
    created_by: { username: string; first_name: string; last_name: string }; /// created_by
    created_by_team: string;
    comment?: string;
    links?: LinkWithAlias[];
    files?: FileWithName[];
    amount?: number;
    transition_key: string; // (step name)
    transition_label: string; // (step name)
    // eslint-disable-next-line no-undef
    deleted_at: Nullable<string>;
};

export type StepForm = {
    transition_key: string;
    budget_process?: string;
    comment: Optional<string>;
    files: Optional<File[]>;
    links: Optional<LinkWithAlias[]>;
    amount: Optional<number>;
    general: Nullable<string[]>;
    attachments: Nullable<string[]>;
};

export type OverrideStepForm = {
    new_state_key: Optional<string>;
    budget_process?: string;
    comment: Optional<string>;
    files: Optional<File[]>;
    links: Optional<LinkWithAlias[]>;
    amount: Optional<number>;
    general: Nullable<string[]>;
    attachments: Nullable<string[]>;
};

export type Workflow = {
    states: {
        key: string;
        label: string;
    }[];
};

export type Options = {
    value: number;
    label: string;
};

export type OptionsCampaigns = {
    value: number;
    label: string;
    country_id: number;
};

export type OptionsRounds = {
    value: number;
    label: string;
    campaign_id: number;
    target_population?: number;
    on_hold?: boolean;
};

export type DropdownOptions = {
    countries: Options[];
    campaigns: OptionsCampaigns[];
    rounds: OptionsRounds[];
};
