import * as vscode from "vscode";

const LEVEL_KEY = "level";
const INSTRUCTION_KEY = "instruction";

/**
 * Store the default level in the vscode storage system
 */
export const storeDefaultLevel = (
  context: vscode.ExtensionContext,
  level: string
) => {
  context.globalState.update(LEVEL_KEY, level);
};

/**
 * Get the default level stored in the vscode storage system
 */
export const getDefaultLevel = (
  context: vscode.ExtensionContext,
  defaultLevel: string = "function"
): string => {
  let level = context.globalState.get<string>(LEVEL_KEY);
  if (!level) {
    level = defaultLevel;
  }
  return level;
};

/**
 * Store the default level in the vscode storage system
 */
export const storeInstruction = (
  context: vscode.ExtensionContext,
  instruction: string
) => {
  context.globalState.update(INSTRUCTION_KEY, instruction);
};

/**
 * Get the default level stored in the vscode storage system
 */
export const getInstruction = (
  context: vscode.ExtensionContext
): string | undefined => {
  return context.globalState.get<string>(INSTRUCTION_KEY);
};
