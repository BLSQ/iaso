import React, { useState, useCallback, useEffect } from 'react';
import classnames from 'classnames';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import {
    withStyles,
    Grid,
    Box,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';

import { commonStyles } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { useFormState } from '../../../hooks/form';
import OrgUnitInfos from './OrgUnitInfosComponent';

const initialFormState = orgUnit => {
    return {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit.org_unit_type_id
            ? `${orgUnit.org_unit_type_id}`
            : null,
        groups: orgUnit.groups?.map(g => g.id) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
        creator: orgUnit.creator,
    };
};

const styles = theme => ({
    ...commonStyles(theme),
    alignCenter: {
        display: 'flex',
        justifyContent: 'center',
    },
    alignRight: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    marginTop: {
        marginTop: '-32px',
    },
});
const OrgUnitForm = ({
    orgUnit,
    classes,
    orgUnitTypes,
    groups,
    saveOrgUnit,
    params,
    baseUrl,
    onResetOrgUnit,
    isFetchingOrgUnitTypes,
    isFetchingGroups,
}) => {
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(initialFormState(orgUnit));
    const [orgUnitModified, setOrgUnitModified] = useState(false);
    const handleSave = () => {
        const newOrgUnit = mapValues(formState, v =>
            Object.prototype.hasOwnProperty.call(v, 'value') ? v.value : v,
        );
        saveOrgUnit(
            newOrgUnit,
            savedOrgUnit => {
                setOrgUnitModified(true);
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
            } else {
                setOrgUnitModified(false);
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

    const theme = useTheme();
    const isNewOrgunit = params.orgUnitId === '0';
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (orgUnit.id !== formState.id.value) {
            setFormState(initialFormState(orgUnit));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgUnit.id]);

    return (
        <Box pt={isNewOrgunit ? 2 : 0}>
        <>
            <Grid
                container
                spacing={0}
                alignItems="center"
                className={classnames(
                    !isNewOrgunit && classes.marginTopBig,
                    isNewOrgunit ? classes.alignCenter : classes.alignRight,
                    isNewOrgunit && isMobileLayout && classes.alignRight,
                )}
            >
                <OrgUnitInfos
                    params={params}
                    baseUrl={baseUrl}
                    orgUnit={{
                        ...orgUnit,
                        ...formState,
                    }}
                    orgUnitTypes={orgUnitTypes}
                    groups={groups}
                    onChangeInfo={handleChangeInfo}
                    resetTrigger={!orgUnitModified}
                    handleSave={handleSave}
                    handleReset={handleReset}
                    orgUnitModified={orgUnitModified}
                />
            </Grid>
        </Box>
    );
};

OrgUnitForm.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    onResetOrgUnit: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    isFetchingOrgUnitTypes: PropTypes.bool.isRequired,
    isFetchingGroups: PropTypes.bool.isRequired,
};

export default withStyles(styles)(OrgUnitForm);
