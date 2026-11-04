#!/usr/bin/env node

// taken from https://gist.github.com/felskov/84fa477e87fb18f3ff7bee4ee2ce1c57

import path from "path";
import ts from "typescript";

//
// parse tsconfig.json
//

const domainsToCheck = [
    "teams",
    "app",
    "forms",
    "accounts",
    "algorithmRuns",
    "missions",
    "validationWorkflowsConfiguration",
    "validationWorkflowsInstance"

]
const configFilePath = ts.findConfigFile(
  "./",
  ts.sys.fileExists,
  "tsconfig.json"
);
const projectPath = path.resolve(path.dirname(configFilePath));

const paths = domainsToCheck.map((p) => path.resolve(path.join(projectPath, "hat/assets/js/apps/Iaso/domains", p)))

const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);

const compilerOptions = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  "./",
  {
    incremental: true,
    tsBuildInfoFile: path.join(projectPath, "type-check.tsbuildinfo"),

    // required to force emission of tsbuildinfo file(?)
    outDir: "tmp",
    noEmit: true,
  }
);

//
// setup program
//

const program = ts.createIncrementalProgram({
  rootNames: compilerOptions.fileNames,
  options: compilerOptions.options,
});

//
// run diagnostics and emit a tsbuildinfo for incremental type-checks
//

const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
const emitResult = program.emit();
const buildInfoEmitResult = program.emitBuildInfo();

const diagnostics = [
  ...preEmitDiagnostics,
  ...emitResult.diagnostics,
  ...buildInfoEmitResult.diagnostics,
].filter(
  (it) =>
    paths.some((p) => it.file.fileName.startsWith(`${p}${path.sep}`)) &&
    !it.file.fileName.includes("node_modules")
);

//
// setup reporter utilities
//

const errorCount = ts.getErrorCountForSummary(diagnostics);
const filesInError = ts.getFilesInErrorForSummary(diagnostics);
const diagnosticsReporter = ts.createDiagnosticReporter(ts.sys, true);

const reportDiagnostics = (diagnostics) => {
  for (const diagnostic of diagnostics) {
    diagnosticsReporter(diagnostic);
  }
};

const reportSummary = (errorCount, filesInError) => {
  console.log(
    ts.getErrorSummaryText(errorCount, filesInError, ts.sys.newLine, ts.sys)
  );
};

//
// flush output to console
//

reportDiagnostics(diagnostics);
reportSummary(errorCount, filesInError);

process.exit(errorCount === 0 ? 0 : 1);