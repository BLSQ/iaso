import React, { useState } from 'react';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import { withStyles, Button, Grid } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

import { commonStyles } from 'bluesquare-components';
import { useFormState } from '../../../hooks/form';
import OrgUnitInfos from './OrgUnitInfosComponent';
import MESSAGES from '../messages';

const initialFormState = orgUnit => {
    return {
        name: orgUnit.name,
        org_unit_type_id: orgUnit.org_unit_type_id,
        groups: orgUnit.groups?.map(g => g.id) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
    };
};

const styles = theme => ({
    ...commonStyles(theme),
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
}) => {
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(initialFormState(orgUnit));

    const [orgUnitModified, setOrgUnitModified] = useState(false);
    const handleSave = () => {
        const newOrgUnit = mapValues(formState, v =>
            Object.prototype.hasOwnProperty.call(v, 'value') ? v.value : v,
        );
        saveOrgUnit(newOrgUnit)
            .then(savedOrgUnit => {
                setOrgUnitModified(false);
                setFormState(initialFormState(savedOrgUnit));
            })
            .catch(error => {
                if (error.status === 400) {
                    error.details.forEach(entry => {
                        setFieldErrors(entry.errorKey, [entry.errorMessage]);
                    });
                }
            });
    };

    const handleChangeInfo = (key, value) => {
        setOrgUnitModified(true);
        setFieldValue(key, value);
    };

    const handleReset = () => {
        setOrgUnitModified(false);
        setFormState(initialFormState(orgUnit));
        onResetOrgUnit();
    };

    const isNewOrgunit = orgUnit && !orgUnit.id;
    return (
        <>
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
            />
            <Grid
                container
                spacing={0}
                alignItems="center"
                className={classes.marginTopBig}
            >
                <Grid xs={12} item className={classes.textAlignRight}>
                    {!isNewOrgunit && (
                        <Button
                            className={classes.marginLeft}
                            disabled={!orgUnitModified}
                            variant="contained"
                            onClick={() => handleReset()}
                        >
                            <FormattedMessage {...MESSAGES.cancel} />
                        </Button>
                    )}
                    <Button
                        disabled={!orgUnitModified}
                        variant="contained"
                        className={classes.marginLeft}
                        color="primary"
                        onClick={() => handleSave()}
                    >
                        <FormattedMessage {...MESSAGES.save} />
                    </Button>
                </Grid>
            </Grid>
        </>
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
};

export default withStyles(styles)(OrgUnitForm);
