/* eslint-disable camelcase */
import { UrlParams } from 'bluesquare-components';
import { NameAndId } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type Nopv2AuthStatus = 'ONGOING' | 'SIGNATURE' | 'VALIDATED' | 'EXPIRED';
export type AuthorisationData = {
    id: number;
    comment?: string;
    quantity?: number;
    status: Nopv2AuthStatus;
    expiration_date: string;
    country: NameAndId;
};

export type AuthorisationAPIData = AuthorisationData & {
    created_at: string;
    updated_at: string;
};

export type AuthorisationAPIResponse = {
    results: AuthorisationAPIData[];
    count: number;
    limit: number;
    page: number;
    pages: number;
};

export type VaccineAuthParams = UrlParams & {
    block_country?: string;
    auth_status?: Nopv2AuthStatus;
};
export type VaccineAuthDetailsParams = UrlParams & {
    countryName: string;
    countryId: string; // number in string form
};
