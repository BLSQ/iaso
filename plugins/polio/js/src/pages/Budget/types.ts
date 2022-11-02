/* eslint-disable camelcase */
import {
    Nullable,
    Optional,
} from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type Timeline = {
    categories: Categories;
};

export type Categories = {
    key: string;
    label: string;
    color: string; // css string
    items: {
        label: string;
        performed_on?: string; // datetime
        performed_by?: {
            username;
            first_name;
            last_name;
        }; // User
    }[];
}[];

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
    next_transitions?: {
        key: string;
        label: string;
        color: Nullable<'primary' | 'green' | 'red'>;
        allowed: boolean; // depends on the user's team
        reason_not_allowed: Nullable<string>;
        required_fields: string[]; // comment, file, links
        help_text: string;
        emails_destination_team_ids?: number[];
        displayed_fields: string[]; // This field determines the columns shown in the "create" modal
    }[];
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
    timeline?: Timeline;
};

export type LinkWithAlias = { alias: string; url: string };
export type FileWithName = { file: string; filename: string };

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
    campaign: string;
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
