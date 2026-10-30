import { GoogleGenAI } from '@google/genai';
import { toSinglePrompt, strictFormat } from '../utils/text.js';
import { getKey } from '../utils/keys.js';

// Patch global fetch to use proxy when HTTPS_PROXY is set (Node.js built-in fetch ignores env vars)
const _proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
if (_proxyUrl && typeof globalThis.fetch === 'function') {
    try {
        const { ProxyAgent, fetch: undiciFetch } = await import('undici');
        const _proxyAgent = new ProxyAgent(_proxyUrl);
        globalThis.fetch = (url, init) => undiciFetch(url, { ...init, dispatcher: _proxyAgent });
        console.log(`[gemini] Using proxy: ${_proxyUrl}`);
    } catch (_e) {
        console.warn('[gemini] undici not available, proxy not configured');
    }
}

export class Gemini {
    constructor(model_name, url, params) {
        this.model_name = model_name;
        this.params = params;
        this.url = url;
        this.safetySettings = [
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
                threshold: 'BLOCK_NONE',
            },
        ];

        this.genAI = new GoogleGenAI({ apiKey: getKey('GEMINI_API_KEY') });
    }

    async sendRequest(turns, systemMessage) {
        console.log('Awaiting Google API response...');

        turns.unshift({ role: 'system', content: systemMessage });
        turns = strictFormat(turns);
        let contents = [];
        for (let turn of turns) {
            contents.push({
                role: turn.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: turn.content }]
            });
        }

        const requestParams = {
            model: this.model_name || 'gemini-1.5-flash',
            contents,
            config: {
                ...(this.params || {}),
                safetySettings: this.safetySettings,
            },
        };

        const response = await this.genAI.models.generateContent(requestParams);
        let text;

        // Handle "thinking" models since they smart
        if (this.model_name && this.model_name.includes('thinking')) {
            if (
                response.candidates &&
                response.candidates.length > 0 &&
                response.candidates[0].content &&
                response.candidates[0].content.parts &&
                response.candidates[0].content.parts.length > 1
            ) {
                text = response.candidates[0].content.parts[1].text;
            } else {
                console.warn('Unexpected response structure for thinking model:', response);
                text = response.text;
            }
        } else {
            text = response.text;
        }

        console.log('Received.');

        return text;
    }

    async sendVisionRequest(turns, systemMessage, imageBuffer) {
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const stop_seq = '***';
        const prompt = toSinglePrompt(turns, systemMessage, stop_seq, 'model');
        let res = null;
        try {
            console.log('Awaiting Google API vision response...');
            const response = await this.genAI.models.generateContent({
                model: this.model_name || 'gemini-1.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
                config: {
                    safetySettings: this.safetySettings,
                },
            });
            const text = response.text;
            console.log('Received.');
            if (!text.includes(stop_seq)) return text;
            const idx = text.indexOf(stop_seq);
            res = text.slice(0, idx);
        } catch (err) {
            console.log(err);
            if (err.message.includes('Image input modality is not enabled for models/')) {
                res = 'Vision is only supported by certain models.';
            } else {
                res = 'An unexpected error occurred, please try again.';
            }
        }
        return res;
    }

    async embed(text) {
        const response = await this.genAI.models.embedContent({
            model: 'text-embedding-004',
            contents: [text],
        });
        return response.embeddings[0].values;
    }
}
