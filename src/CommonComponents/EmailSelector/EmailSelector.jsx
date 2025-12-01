import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * props:
 *  - options: array of { id, email, name }
 *  - value: array of selected option objects
 *  - onChange: (selectedArray) => void
 *  - label: string
 */
const EmailSelector = ({ options = [], value = [], onChange = () => {}, label = "Emails" }) => {
  return (
    <Autocomplete
      multiple
      options={options}
      value={value}
      onChange={(e, v) => onChange(v)}
      disableCloseOnSelect
      getOptionLabel={(opt) => opt.email || opt.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
          {option.name ? `${option.name} — ${option.email}` : option.email}
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip key={option.id} label={option.name ? `${option.name} <${option.email}>` : option.email} {...getTagProps({ index })} />
        ))
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder="Select emails" />}
    />
  );
};

export default EmailSelector;