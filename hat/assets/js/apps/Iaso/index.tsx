// import React from 'react';
// import ReactDOM from 'react-dom';
// import '@mui/material';

// import('./bootstrap')

// import { iasoApp } from './bootstrap'

// console.log("Setting iasoApp to window")
// window.iasoApp = iasoApp;

const loadApp = async () => {
    const { iasoApp } = await import("./bootstrap");
    console.log("Setting iasoApp to window")
    window.iasoApp = iasoApp;
    console.log("Dispatching event iasoAppLoaded")
    window.dispatchEvent(new Event('iasoAppLoaded'));
};

loadApp();