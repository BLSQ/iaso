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

export const countMergedDistricts = (scopeLists: Scope[][]): number =>
    new Set(scopeLists.flatMap(scopes => [...uniqueDistrictIds(scopes)])).size;

type RoundLike = { number: number; scopes?: Scope[] };

export type ScopeChangeDirection = 'toRounds' | 'toCampaign';

/** Union of district ids. If a district appears in several lists, the last vaccine wins. */
export const mergeScopes = (scopeLists: Scope[][]): Scope[] => {
    const districtToVaccine = new Map<number, Vaccine | undefined>(
        scopeLists.flatMap(scopes =>
            (scopes ?? []).flatMap(scope =>
                (scope.group?.org_units ?? []).map(
                    (id): [number, Vaccine | undefined] => [id, scope.vaccine],
                ),
            ),
        ),
    );
    const byVaccine = new Map<string, number[]>();
    districtToVaccine.forEach((vaccine, id) => {
        const key = vaccine ?? '';
        byVaccine.set(key, [...(byVaccine.get(key) ?? []), id]);
    });
    return Array.from(byVaccine.entries()).map(([vaccine, org_units]) => ({
        vaccine: (vaccine || undefined) as Vaccine | undefined,
        group: { org_units },
    }));
};

const copyCampaignScopesToSelectedRounds = <T extends RoundLike>({
    rounds,
    campaignScopes,
    selectedRoundNumbers,
}: {
    rounds: T[];
    campaignScopes: Scope[];
    selectedRoundNumbers: number[];
}): { rounds: T[]; scopes: Scope[] } => {
    const selected = new Set(selectedRoundNumbers);
    return {
        scopes: campaignScopes,
        rounds: rounds.map(round => ({
            ...round,
            scopes: selected.has(round.number) ? cloneDeep(campaignScopes) : [],
        })),
    };
};

const mergeSelectedRoundScopesIntoCampaign = <T extends RoundLike>({
    rounds,
    selectedRoundNumbers,
}: {
    rounds: T[];
    selectedRoundNumbers: number[];
}): { rounds: T[]; scopes: Scope[] } => {
    const selected = new Set(selectedRoundNumbers);
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

export const applyScopeChange = <T extends RoundLike>({
    direction,
    rounds,
    campaignScopes,
    selectedRoundNumbers,
}: {
    direction: ScopeChangeDirection;
    rounds: T[];
    campaignScopes: Scope[];
    selectedRoundNumbers: number[];
}): { rounds: T[]; scopes: Scope[] } =>
    direction === 'toRounds'
        ? copyCampaignScopesToSelectedRounds({
              rounds,
              campaignScopes,
              selectedRoundNumbers,
          })
        : mergeSelectedRoundScopesIntoCampaign({
              rounds,
              selectedRoundNumbers,
          });
