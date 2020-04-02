import React from "react";

import Typography from "@material-ui/core/Typography";
const ObjectDumper = ({ object }) => {
  return (
    <div style={{ paddingLeft: "20px" }}>
      {Object.keys(object).map(field => (
        <>
          <Typography variant="body1">
            <b>{field} :</b>{" "}
            {typeof object[field] === "string"
              ? object[field]
              : JSON.stringify(object[field])}
          </Typography>
        </>
      ))}
    </div>
  );
};

export default ObjectDumper;
