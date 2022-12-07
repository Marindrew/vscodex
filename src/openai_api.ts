import internal = require("stream");

import { Config } from "./config";

const superagent = require("superagent");

// Endpoint for the OpenAI API codex completion
const CODEX_URL = "https://api.openai.com/v1/engines/davinci-codex/completions";

const CODEX_EDIT = "https://api.openai.com/v1/edits";
const CODEX_EDIT_MODEL = "text-davinci-edit-001";

/**
 * Send a request to the OpenAI server to get the tokens following prompt.
 */
export const getCodeEdit = async (
  input: string,
  instruction: string,
  config: Config,
  apiKey: string
): Promise<string> =>
  new Promise((resolve, reject) => {
    superagent
      .post(CODEX_EDIT)
      .send({
        /* eslint-disable @typescript-eslint/naming-convention */
        model: CODEX_EDIT_MODEL,
        input: input,
        instruction: instruction,
        temperature: config.temperature,
        top_p: config.topP,
      })
      .set("Authorization", "Bearer " + apiKey)
      .end((error: any, response: any) => {
        if (error) {
          let message: string;
          // If the API specified an error message, return it.
          if (error.response.text) {
            message = JSON.parse(error.response.text).error.message;
          } else {
            message = error;
          }
          reject(new Error(message));
          return;
        }

        const resp = JSON.parse(response.text);

        if (resp["choices"].length === 0) {
          reject(new Error("No code returned by the server."));
        } else {
          resolve(String(resp["choices"][0]["text"]));
        }
      });
  });

/**
 * Send a request to the OpenAI server to get the tokens following prompt.
 */
export const getNextTokens = async (
  prompt: string,
  config: Config,
  apiKey: string
): Promise<string> =>
  new Promise((resolve, reject) => {
    superagent
      .post(CODEX_URL)
      .send({
        /* eslint-disable @typescript-eslint/naming-convention */
        prompt: prompt,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        presence_penalty: config.presencePenalty,
        frequency_penalty: config.frequencyPenalty,
        stop: config.stop.length === 0 ? null : config.stop, // API does not accept empty array
      })
      .set("Authorization", "Bearer " + apiKey)
      .end((error: any, response: any) => {
        if (error) {
          let message: string;
          // If the API specified an error message, return it.
          if (error.response.text) {
            message = JSON.parse(error.response.text).error.message;
          } else {
            message = error;
          }
          reject(new Error(message));
          return;
        }

        const resp = JSON.parse(response.text);

        if (resp["choices"].length === 0) {
          reject(new Error("No code returned by the server."));
        } else {
          resolve(String(resp["choices"][0]["text"]));
        }
      });
  });
