import OpenAIApi from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getKey, hasKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

export class GPT {
    constructor(model_name, url, params, proxy) {
        this.model_name = model_name;
        this.params = params;

        let config = {};
        if (url)
            config.baseURL = url;

        if (hasKey('OPENAI_ORG_ID'))
            config.organization = getKey('OPENAI_ORG_ID');

        config.apiKey = getKey('OPENAI_API_KEY');

        // Proxy resolution order:
        //   1. explicit proxy arg (e.g. from profile JSON "proxy" field)
        //   2. https_proxy / http_proxy environment variables
        // Required when running behind a local proxy (e.g. v2rayN/ClashX on macOS)
        // because node-fetch does not read these variables automatically.
        const proxyUrl = proxy || process.env.https_proxy || process.env.http_proxy;
        if (proxyUrl) {
            config.httpAgent = new HttpsProxyAgent(proxyUrl);
        }

        this.openai = new OpenAIApi(config);
    }

    async sendRequest(turns, systemMessage, stop_seq='***') {
        let messages = [{'role': 'system', 'content': systemMessage}].concat(turns);

        const pack = {
            model: this.model_name || "gpt-3.5-turbo",
            messages,
            stop: stop_seq,
            ...(this.params || {})
        };
        if (this.model_name.includes('o1')) {
            pack.messages = strictFormat(messages);
            delete pack.stop;
        }
        // Claude models (via OpenAI-compatible endpoints) do not support the stop parameter
        if (this.model_name.includes('claude')) {
            delete pack.stop;
        }

        let res = null;

        try {
            console.log('Awaiting openai api response from model', this.model_name)
            // console.log('Messages:', messages);
            let completion = await this.openai.chat.completions.create(pack);
            if (!completion.choices || completion.choices.length === 0)
                throw new Error('Empty choices in response');
            if (completion.choices[0].finish_reason == 'length')
                throw new Error('Context length exceeded');
            console.log('Received.')
            res = completion.choices[0].message.content;
        }
        catch (err) {
            if ((err.message == 'Context length exceeded' || err.code == 'context_length_exceeded') && turns.length > 1) {
                console.log('Context length exceeded, trying again with shorter context.');
                return await this.sendRequest(turns.slice(1), systemMessage, stop_seq);
            } else if (err.message.includes('image_url')) {
                console.log(err);
                res = 'Vision is only supported by certain models.';
            } else {
                console.log(err);
                res = 'My brain disconnected, try again.';
            }
        }
        return res;
    }

    async sendVisionRequest(messages, systemMessage, imageBuffer) {
        const imageMessages = [...messages];
        imageMessages.push({
            role: "user",
            content: [
                { type: "text", text: systemMessage },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                    }
                }
            ]
        });
        
        return this.sendRequest(imageMessages, systemMessage);
    }

    async embed(text) {
        if (text.length > 8191)
            text = text.slice(0, 8191);
        const embedding = await this.openai.embeddings.create({
            model: this.model_name || "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return embedding.data[0].embedding;
    }

}



