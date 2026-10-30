import OpenAIApi from 'openai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { getKey, hasKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

// 如果设置了 HTTPS_PROXY 环境变量，通过代理转发所有请求（中国区访问 OpenRouter 需要）
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY;
if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log(`[OpenRouter] 使用代理: ${proxyUrl}`);
}

export class OpenRouter {
    constructor(model_name, url) {
        this.model_name = model_name;

        let config = {};
        config.baseURL = url || 'https://openrouter.ai/api/v1';

        const apiKey = getKey('OPENROUTER_API_KEY');
        if (!apiKey) {
            console.error('Error: OPENROUTER_API_KEY not found. Make sure it is set properly.');
        }

        // Pass the API key to OpenAI compatible Api
        config.apiKey = apiKey; 

        this.openai = new OpenAIApi(config);
    }

    async sendRequest(turns, systemMessage, stop_seq='') {
        let messages = [{ role: 'system', content: systemMessage }, ...turns];
        messages = strictFormat(messages);

        // Choose a valid model from openrouter.ai (for example, "openai/gpt-4o")
        // NOTE: only forward a non-empty stop sequence. The previous default '*' caused
        // some OpenRouter-routed providers (Gemma-3-12B, Ministral-8B) to return empty
        // content (finish=stop, usage=undefined) on long prompts — a provider-side
        // intolerance of the stop param, not a model failure. Llama is unaffected either
        // way. Default changed from '*' to '' so stop is omitted unless a caller sets one.
        const pack = {
            model: this.model_name,
            messages,
        };
        if (stop_seq && stop_seq.length > 0) {
            pack.stop = stop_seq;
        }

        let res = null;
        try {
            console.log('Awaiting openrouter api response...');
            let completion = await this.openai.chat.completions.create(pack);
            if (!completion?.choices?.[0]) {
                console.error('No completion or choices returned:', completion);
                return 'No response received.';
            }
            if (completion.choices[0].finish_reason === 'length') {
                throw new Error('Context length exceeded');
            }
            console.log('Received.');
            res = completion.choices[0].message.content;
        } catch (err) {
            console.error('Error while awaiting response:', err);
            // If the error indicates a context-length problem, we can slice the turns array, etc.
            res = 'My brain disconnected, try again.';
        }
        return res;
    }

    embed(text) {
        throw new Error('Embeddings are not supported by Openrouter.');
    }
}