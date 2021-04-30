import { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import { SidebarMenu } from "./SidebarMenu";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    marginLeft: theme.spacing(1),
  },
}));

export const Layout = ({ children }) => {
  const classes = useStyles();
  const [isDrawerOpened, setDrawerOpened] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpened((state) => !state);
  };
  return (
    <>
      <AppBar position="relative" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="inherit">
            Polio Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      {children}
      <SidebarMenu
        isDrawerOpened={isDrawerOpened}
        toggleDrawer={toggleDrawer}
      />
    </>
  );
};
