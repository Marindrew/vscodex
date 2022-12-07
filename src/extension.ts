/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";

import { getCodeEdit, getNextTokens } from "./openai_api";
import { getApiKey, getDefaultConfig } from "./config";
import { getSelection } from "./context";
import { storeDefaultLevel, storeInstruction, getInstruction } from "./storage";

// import superagent from 'superagent';
const superagent = require("superagent");

//Create output channel
const vscodexOut = vscode.window.createOutputChannel("vscodex");

async function appendCurrentSelection(context: vscode.ExtensionContext) {
  let selectionObj = getSelection();
  if (!selectionObj || !selectionObj.selection || !selectionObj.text) {
    vscode.window.showWarningMessage(
      "No text selected! Please select some text."
    );
    return;
  }
  let selection = selectionObj.selection;
  let text = selectionObj.text;

  // Display a progress bar while fetching the response
  vscode.window.withProgress(
    {
      cancellable: true,
      location: vscode.ProgressLocation.Notification,
      title: "VSCodex",
    },
    async (progress, cancelToken) => {
      progress.report({
        message: "Completion request sent, waiting the response...",
      });

      await getNextTokens(text, getDefaultConfig(context), getApiKey())
        .catch((error) => {
          vscode.window.showErrorMessage(error.toString());
        })
        .then((completion) => {
          // Do not edit selection if the user requested cancelation
          if (cancelToken.isCancellationRequested || !completion) {
            return;
          }

          if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.edit((editBuilder) => {
              editBuilder.insert(selection.end, completion);
            });
          }
        });
    }
  );
}

async function editCurrentSelection(context: vscode.ExtensionContext) {
  const selectionObj = getSelection();
  const instruction = getInstruction(context);
  if (!instruction || !instruction.length) {
    vscode.window.showWarningMessage(
      "No instruction set! Please set an instruction."
    );
    return;
  }
  if (!selectionObj || !selectionObj.selection || !selectionObj.text) {
    vscode.window.showWarningMessage(
      "No text selected! Please select some text."
    );
    return;
  }
  let selection = selectionObj.selection;
  let text = selectionObj.text;

  // Display a progress bar while fetching the response
  vscode.window.withProgress(
    {
      cancellable: true,
      location: vscode.ProgressLocation.Notification,
      title: "VSCodex",
    },
    async (progress, cancelToken) => {
      progress.report({
        message: "Edit request sent, waiting the response...",
      });

      await getCodeEdit(
        text,
        instruction,
        getDefaultConfig(context),
        getApiKey()
      )
        .catch((error) => {
          vscode.window.showErrorMessage(error.toString());
        })
        .then((completion) => {
          // Do not edit selection if the user requested cancelation
          if (cancelToken.isCancellationRequested || !completion) {
            return;
          }

          if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.edit((editBuilder) => {
              editBuilder.replace(selection, completion);
            });
          }
        });
    }
  );
}

/**
 * User select a "prediction size level", between function-level, class-level, and file-level.
 * Each level contains stop keyword, for example in python: \
 * * line-level: `stop = ["\n"]`
 * * function-level: `stop = ["def", "@"]`
 * * class-level: `stop = ["class"]`
 * * file-level: `stop = []`
 *
 * Sent stop sequence is the sum of all stop sequence of upper level.
 * In the previous example, if function-level is selected, stop sequence will be ["def", "@", "class"]
 */
async function pickAndSetLevel(context: vscode.ExtensionContext) {
  const choice = await vscode.window.showQuickPick(
    ["Function", "Class", "File", "Custom"],
    { placeHolder: "Select a completion level." }
  );
  if (choice) {
    storeDefaultLevel(context, choice);
  }
}

/**
 * User select a "instruction"
 */
async function promptAndSetInstruction(context: vscode.ExtensionContext) {
  console.log("promptAndSetInstruction");
  const instruction = await vscode.window.showInputBox({
    placeHolder: "Enter an instruction.",
  });
  if (instruction) {
    storeInstruction(context, instruction);
  }
}

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const predict = vscode.commands.registerCommand(
    "vscodex.predict",
    async function () {
      appendCurrentSelection(context);
    }
  );
  context.subscriptions.push(predict);

  const setLevelAndPredict = vscode.commands.registerCommand(
    "vscodex.setLevelAndPredict",
    async function () {
      await pickAndSetLevel(context);
      appendCurrentSelection(context);
    }
  );

  const setInstructionAndEdit = vscode.commands.registerCommand(
    "vscodex.setInstructionAndEdit",
    async function () {
      await promptAndSetInstruction(context);
      editCurrentSelection(context);
    }
  );
}

// this method is called when the extension is deactivated
export function deactivate() {}
