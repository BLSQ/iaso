import React from 'react';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import {
    withStyles, Button, Grid,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

import { useFormState } from '../../../hooks/form';
import OrgUnitInfos from './OrgUnitInfosComponent';
import MESSAGES from '../messages';
import commonStyles from '../../../styles/common';

const initialFormState = orgUnit => ({
    name: orgUnit.name,
    org_unit_type_id: orgUnit.org_unit_type_id,
    groups: orgUnit.groups.map(g => g.id),
    sub_source: orgUnit.sub_source,
    validation_status: orgUnit.validation_status,
    aliases: orgUnit.aliases,
    parent_id: orgUnit.parent_id,
});

const styles = theme => ({
    ...commonStyles(theme),
});
const OrgUnitForm = ({
    orgUnit,
    classes,
    orgUnitTypes,
    sources,
    groups,
    saveOrgUnit,
    params,
    baseUrl,
    onResetOrgUnit,
}) => {
    const [formState, setFieldValue, setFieldErrors, setFormState] = useFormState(initialFormState(orgUnit));

    const [orgUnitModified, setOrgUnitModified] = React.useState(false);
    const handleSaveOrgunit = () => {
        const newOrgUnit = mapValues(formState, v => (Object.prototype.hasOwnProperty.call(v, 'value') ? v.value : v));
        saveOrgUnit(newOrgUnit).then()
            .catch((error) => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(entry => setFieldErrors(entry[0], entry[1]));
                }
            });
    };

    const handleChangeInfo = (key, value) => {
        setOrgUnitModified(true);
        setFieldValue(key, value);
    };

    const reset = () => {
        setOrgUnitModified(false);
        setFormState(initialFormState(orgUnit));
        onResetOrgUnit();
    };

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
                sources={sources}
                groups={groups}
                onChangeInfo={handleChangeInfo}
            />
            <Grid container spacing={0} alignItems="center" className={classes.marginTopBig}>
                <Grid xs={12} item className={classes.textAlignRight}>
                    <Button
                        className={classes.marginLeft}
                        disabled={!orgUnitModified}
                        variant="contained"
                        onClick={() => reset()}
                    >
                        <FormattedMessage {...MESSAGES.cancel} />
                    </Button>
                    <Button
                        disabled={!orgUnitModified}
                        variant="contained"
                        className={classes.marginLeft}
                        color="primary"
                        onClick={() => handleSaveOrgunit()}
                    >
                        <FormattedMessage {...MESSAGES.save} />
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};


OrgUnitForm.defaultProps = {
    sources: [],
};

OrgUnitForm.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    sources: PropTypes.array,
    saveOrgUnit: PropTypes.func.isRequired,
    onResetOrgUnit: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
};

export default withStyles(styles)(OrgUnitForm);
