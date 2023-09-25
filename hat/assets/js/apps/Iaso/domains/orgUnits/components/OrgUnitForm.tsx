import React, {
    useState,
    useCallback,
    useEffect,
    FunctionComponent,
} from 'react';
import classnames from 'classnames';
import mapValues from 'lodash/mapValues';
import { Grid, Box, makeStyles } from '@material-ui/core';

import { commonStyles } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { useFormState } from '../../../hooks/form';
import { OrgUnitInfos } from './OrgUnitInfos';
import { OrgUnit, Group, OrgunitInititialState } from '../types/orgUnit';
import { OrgunitType } from '../types/orgunitTypes';

const initialFormState = (orgUnit: OrgUnit): OrgunitInititialState => ({
    id: orgUnit.id,
    name: orgUnit.name,
    org_unit_type_id: orgUnit.org_unit_type_id
        ? `${orgUnit.org_unit_type_id}`
        : undefined,
    groups: orgUnit.groups?.map(g => g.id) ?? [],
    sub_source: orgUnit.sub_source,
    validation_status: orgUnit.validation_status,
    aliases: orgUnit.aliases,
    source_id: orgUnit.source_id,
    parent: orgUnit.parent,
    source_ref: orgUnit.source_ref,
    reference_instance_id: orgUnit.reference_instance_id,
});

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    orgUnit: OrgUnit;
    orgUnitTypes: OrgunitType[];
    groups: Group[];
    saveOrgUnit: (
        // eslint-disable-next-line no-unused-vars
        newOu: OrgUnit,
        // eslint-disable-next-line no-unused-vars
        onSuccess: (unit: OrgUnit) => void,
        // eslint-disable-next-line no-unused-vars
        onError: (error: any) => void,
    ) => void;
    params: Record<string, string>;
    onResetOrgUnit: () => void;
    isFetchingOrgUnitTypes: boolean;
    isFetchingGroups: boolean;
};

export const OrgUnitForm: FunctionComponent<Props> = ({
    orgUnit,
    orgUnitTypes,
    groups,
    saveOrgUnit,
    params,
    onResetOrgUnit,
    isFetchingOrgUnitTypes,
    isFetchingGroups,
}) => {
    const classes: Record<string, string> = useStyles();
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(initialFormState(orgUnit));
    const [orgUnitModified, setOrgUnitModified] = useState(false);
    const handleSave = () => {
        const newOrgUnit = mapValues(formState, v =>
            Object.prototype.hasOwnProperty.call(v, 'value') ? v.value : v,
        );
        newOrgUnit.parent_id = newOrgUnit.parent?.id;
        saveOrgUnit(
            newOrgUnit as OrgUnit,
            savedOrgUnit => {
                setOrgUnitModified(false);
                setFormState(initialFormState(savedOrgUnit));
            },
            error => {
                if (error.status === 400) {
                    error.details.forEach(entry => {
                        setFieldErrors(entry.errorKey, [entry.errorMessage]);
                    });
                }
            },
        );
    };

    const handleChangeField = useCallback(
        (key, value) => {
            setOrgUnitModified(true);
            setFieldValue(key, value);
        },
        [setFieldValue],
    );

    // TODO change component in blsq-comp library to avoid separate handler
    // This fix assumes we can only add one alias at a time
    const handleChangeAlias = useCallback(
        (key, value) => {
            const orgUnitAliases = orgUnit.aliases ?? [];
            const newAlias = value[value.length - 1];
            const actualAliases = value.filter(alias => alias !== '');
            if (newAlias !== '' && !isEqual(actualAliases, orgUnitAliases)) {
                setOrgUnitModified(true);
            }
            setFieldValue(key, value);
        },
        [orgUnit.aliases, setFieldValue],
    );

    const handleChangeInfo = useCallback(
        (key, value) => {
            if (key === 'aliases') {
                handleChangeAlias(key, value);
            } else {
                handleChangeField(key, value);
            }
        },
        [handleChangeAlias, handleChangeField],
    );

    const handleReset = () => {
        setOrgUnitModified(false);
        setFormState(initialFormState(orgUnit));
        onResetOrgUnit();
    };

    const isNewOrgunit = params.orgUnitId === '0';

    useEffect(() => {
        if (orgUnit.id !== formState.id.value) {
            setFormState(initialFormState(orgUnit));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgUnit.id]);
    return (
        <Box pt={isNewOrgunit ? 2 : 0}>
            <Grid
                container
                spacing={0}
                alignItems="center"
                className={classnames(!isNewOrgunit && classes.marginTopBig)}
            >
                <OrgUnitInfos
                    params={params}
                    orgUnitState={formState}
                    orgUnit={orgUnit}
                    orgUnitTypes={orgUnitTypes}
                    groups={groups}
                    onChangeInfo={handleChangeInfo}
                    resetTrigger={!orgUnitModified}
                    handleSave={handleSave}
                    handleReset={handleReset}
                    orgUnitModified={orgUnitModified}
                    isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
                    isFetchingGroups={isFetchingGroups}
                    referenceInstances={orgUnit.reference_instances}
                    setFieldErrors={setFieldErrors}
                />
            </Grid>
        </Box>
    );
};
