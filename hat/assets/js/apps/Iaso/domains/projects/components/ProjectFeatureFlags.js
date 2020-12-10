import React from 'react';
import PropTypes from 'prop-types';
// import { Chip, makeStyles, Box, Typography } from '@material-ui/core';
// import orderBy from 'lodash/orderBy';
// import { FormattedMessage } from 'react-intl';

import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

// const useStyles = makeStyles(theme => ({
//     chipList: {
//         marginTop: theme.spacing(2),
//     },
//     chipListTitle: {
//         marginBottom: theme.spacing(1),
//     },
//     chip: {
//         marginRight: theme.spacing(1),
//         marginBottom: theme.spacing(1),
//     },
// }));

const ProjectFeatureFlags = ({
    setFieldValue,
    currentProject,
    featureFlags,
}) => {
    // const classes = useStyles();
    // const handleDelete = ou => {
    //     const orgUnitsList = [...currentProject.feature_flags.value];
    //     const currentOuIndex = orgUnitsList.findIndex(o => o.id === ou.id);
    //     orgUnitsList.splice(currentOuIndex, 1);
    //     handleChange(orgUnitsList);
    // };
    // const handleAdd = ou => {
    //     let orgUnitsList = [...currentProject.feature_flags.value];
    //     const currentOuIndex = orgUnitsList.findIndex(o => o.id === ou.id);
    //     if (currentOuIndex === -1) {
    //         orgUnitsList.push(ou);
    //     }
    //     orgUnitsList = orderBy(orgUnitsList, [o => o.name], ['asc']);
    //     handleChange(orgUnitsList);
    // };

    // projects.map(p => ({
    //     label: p.name,
    //     value: p.id,
    // }))

    // {id:2,name:"Exige l'authentification",code:"REQUIRE_AUTHENTICATION"},
    // {id:1,name:"Export instantané vers DHIS2",code:"INSTANT_EXPORT"},
    // {id:3,name:"GPS Auto sur nouveau formulaire","code":"TAKE_GPS_ON_FORM"}

    return (
        <>
            {JSON.stringify(featureFlags)}
            =======================================
            {JSON.stringify(currentProject.feature_flags.value)}
            <InputComponent
                multi
                clearable
                keyValue="feature_flags"
                onChange={
                    (key, value) => setFieldValue(key, value)
                    // this.setFieldValue(key, commaSeparatedIdsToArray(value))
                }
                value={currentProject.feature_flags.value.join(',')}
                errors={currentProject.feature_flags.errors}
                type="select"
                options={featureFlags.map(fF => ({
                    label: fF.name,
                    value: { id: fF.id, code: fF.code, name: fF.name },
                }))}
                label={MESSAGES.feature_flags}
                required
            />
        </>
    );
};

ProjectFeatureFlags.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    currentProject: PropTypes.object.isRequired,
    featureFlags: PropTypes.array.isRequired,
};

export default ProjectFeatureFlags;
