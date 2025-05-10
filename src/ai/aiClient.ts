import OpenAI from "openai";
import config from "../common/config/config";
export class AIClient {
  openai: OpenAI;
  promptA = {
    zh: `你是一个会议总结助手，你将通过阅读会议记录，返回一个总结，
                  包含会议主题，会议关键字，会议摘要。总结语言和会议记录语言一样。其中会议摘要小于300字`,
    en: `You are a meeting summary assistant. You will provide a summary
                 by reading the meeting notes, including the meeting 
                theme, keywords, and summary. The meeting summary should be less than 300 words.`,
  };
  promptB = {
    zh: `你是一个会议总结助手，由于你处理的token大小有限，我将文本分为了几段进行总结，
            现在帮我把这几段合并为一个总结，结果包含会议题目，会议关键字，会议摘要。其中会议摘要小于300字`,
    en: `You are a meeting summary assistant. Since the token size you are handling is limited,
     I have divided the text into several sections for summarization. Now, please help me 
     consolidate these sections into a single summary that includes the meeting theme, meeting
      keywords, and meeting abstract. The meeting abstract should be under 300 words.`,
  };
  promptC={
    zh:`会议主题: 会议关键字: 会议摘要:`,
    en:`Conference Topic: Conference Keywords: Conference Summary:`
  }
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL,
    });
  }
  async intelligentSummary(texts: string[],lang:'zh'|'en'): Promise<string> {
    let summaryList: string[] = [];
    for (const text of texts) {
      let completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: "system",
            content: this.promptA[lang],
          },
          { role: "user", content: text },
          { role:"assistant",content:this.promptC[lang]}
        ],
        temperature: 0.3,
        n: 1,
      });
      let content =
        completion.choices[0].message.content === null
          ? ""
          : completion.choices[0].message.content;
      summaryList.push(content);
    }
    console.log("summaryList", summaryList);
    if (summaryList.length === 1) {
      return summaryList[0];
    } else {
      let text = summaryList
        .map((text, index) => `(${index + 1}) \n ${text}`)
        .join("\n");
      let completion = await this.openai.chat.completions.create({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "system",
            content: this.promptB[lang],
          },
          { role: "user", content: text },
          { role:"assistant",content:this.promptC[lang]}
        ],
        temperature: 0.3,
        n:1,
      });
      return completion.choices[0].message.content === null
        ? ""
        : completion.choices[0].message.content;
    }
  }
}
