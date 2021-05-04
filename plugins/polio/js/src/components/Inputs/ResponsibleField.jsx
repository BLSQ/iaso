import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core'

export const ResponsibleField = () => {
    return (
        <FormControl fullWidth variant="outlined">
            <InputLabel id="responsible-label-id">Responsible</InputLabel>
            <Select
                label="Responsible"
                labelId="responsible-label-id"
                id="responsible-field-id"
            >
                <MenuItem value="WHO">WHO</MenuItem>
                <MenuItem value="UNICEF">UNICEF</MenuItem>
                <MenuItem value="NAT">National</MenuItem>
                <MenuItem value="MOH">MOH</MenuItem>
                <MenuItem value="PROV">PROVINCE</MenuItem>
                <MenuItem value="DIST">District</MenuItem>
            </Select>
        </FormControl>
    );
};
