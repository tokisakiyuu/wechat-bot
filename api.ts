import "dotenv/config";
import axios from "axios";
import fs from "fs";
import os from "os";

const cache_file = `${os.tmpdir()}/bce_model_api_token_data.json`;
let tokenData: TokenData | null = getCachedToken();

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]) {
  const token = await getAccessToken();
  const { data } = await axios.request({
    url: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      access_token: token,
    },
    data: {
      messages,
      system: process.env.BCE_MODEL_SYSTEM_PROMPT,
    },
  });
  return data.result;
}

interface TokenData {
  token: string;
  expiryDate: number;
}

/**
 * @see {@link https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Ilkkrb0i5}
 */
async function fetchAccessToken() {
  const { data } = await axios.request({
    url: "https://aip.baidubce.com/oauth/2.0/token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      grant_type: "client_credentials",
      client_id: process.env.BCE_API_KEY,
      client_secret: process.env.BCE_SECRET_KEY,
    },
  });

  const { access_token, expires_in, error, error_description } = data;
  if (error) {
    throw new Error(`[${error}] ${error_description}`);
  }
  return { access_token, expires_in };
}

function getCachedToken() {
  if (!fs.existsSync(cache_file)) return null;
  return JSON.parse(fs.readFileSync(cache_file).toString());
}

function isExpired(data: TokenData) {
  return data.expiryDate < Date.now();
}

async function getAccessToken() {
  if (tokenData && !isExpired(tokenData)) return tokenData.token;
  const { access_token, expires_in } = await fetchAccessToken();
  tokenData = {
    token: access_token,
    expiryDate: Date.now() + expires_in * 1000 - 86400000 /* 1 Day */,
  };
  await fs.promises.writeFile(cache_file, JSON.stringify(tokenData));
  return tokenData.token;
}
