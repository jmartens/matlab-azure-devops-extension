import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as path from "path";
import {platform} from "./utils";

async function run() {
    try {
        const options: IRunTestsOptions = {
            JUnitTestResults: taskLib.getPathInput("testResultsJUnit"),
            CoberturaCodeCoverage: taskLib.getPathInput("codeCoverageCobertura"),
            CodeCoverageSource: taskLib.getInput("codeCoverageSource")};
        await runTests(options);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function runTests(options: IRunTestsOptions) {
    const runToolPath = path.join(__dirname, "bin", "run_matlab_command." + (platform() === "win32" ? "bat" : "sh"));
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg(`addpath('${path.join(__dirname, "scriptgen")}');` +
        `testScript = genscript('Test','WorkingFolder','..',` +
        `'JUnitTestResults','${options.JUnitTestResults || ""}',` +
        `'CoberturaCodeCoverage','${options.CoberturaCodeCoverage || ""}',` +
        `'CodeCoverageSource',{'${options.CodeCoverageSource || "."}'});` +
        `run(testScript.writeToFile('.mw/runAllTests.m'));`);
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunTests"));
    }
}

interface IRunTestsOptions {
    JUnitTestResults?: string;
    CoberturaCodeCoverage?: string;
    CodeCoverageSource?: string;
}

run();
