export type DropdownOptions = {
    label: string;
    value: number | string;
};

export type User = {
    id: number;
    username: string;
    full_name: string;
};

export type ChronogramMetaData = {
    campaigns: DropdownOptions[];
};

export type ChronogramTaskMetaData = {
    period: DropdownOptions[];
    status: DropdownOptions[];
};
