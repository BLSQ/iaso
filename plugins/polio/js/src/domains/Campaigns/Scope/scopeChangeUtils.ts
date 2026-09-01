import cloneDeep from 'lodash/cloneDeep';

import { Scope, Vaccine } from '../../../constants/types';

export const uniqueDistrictIds = (scopes: Scope[] = []): Set<number> => {
    const ids = new Set<number>();
    scopes.forEach(scope => {
        scope.group?.org_units?.forEach(id => ids.add(id));
    });
    return ids;
};

export const countDistricts = (scopes: Scope[] = []): number =>
    uniqueDistrictIds(scopes).size;

export const countMergedDistricts = (scopeLists: Scope[][]): number => {
    const ids = new Set<number>();
    scopeLists.forEach(scopes => {
        uniqueDistrictIds(scopes).forEach(id => ids.add(id));
    });
    return ids.size;
};

type RoundLike = { number: number; scopes?: Scope[] };

/** Union of district ids. If a district appears in several lists, the last vaccine wins. */
export const mergeScopes = (scopeLists: Scope[][]): Scope[] => {
    const districtToVaccine = new Map<number, Vaccine | undefined>();
    scopeLists.forEach(scopes => {
        (scopes ?? []).forEach(scope => {
            scope.group?.org_units?.forEach(id => {
                districtToVaccine.set(id, scope.vaccine);
            });
        });
    });
    const byVaccine = new Map<string, number[]>();
    districtToVaccine.forEach((vaccine, id) => {
        const key = vaccine ?? '';
        const orgUnits = byVaccine.get(key) ?? [];
        orgUnits.push(id);
        byVaccine.set(key, orgUnits);
    });
    return Array.from(byVaccine.entries()).map(([vaccine, org_units]) => ({
        vaccine: (vaccine || undefined) as Vaccine | undefined,
        group: { org_units },
    }));
};

export const applyScopeChange = <T extends RoundLike>({
    toRounds,
    rounds,
    campaignScopes,
    selectedRoundNumbers,
}: {
    toRounds: boolean;
    rounds: T[];
    campaignScopes: Scope[];
    selectedRoundNumbers: number[];
}): { rounds: T[]; scopes: Scope[] } => {
    const selected = new Set(selectedRoundNumbers);
    if (toRounds) {
        return {
            scopes: campaignScopes,
            rounds: rounds.map(round => ({
                ...round,
                scopes: selected.has(round.number)
                    ? cloneDeep(campaignScopes)
                    : [],
            })),
        };
    }
    return {
        rounds,
        scopes: mergeScopes(
            [...rounds]
                .sort((a, b) => a.number - b.number)
                .filter(round => selected.has(round.number))
                .map(round => round.scopes ?? []),
        ),
    };
};
