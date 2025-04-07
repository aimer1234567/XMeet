import { parentPort, workerData } from "worker_threads";
import meetSpeechDao from "../dao/MeetSpeechDao";
import nodejieba from "nodejieba"; // ✅ 替换为 nodejieba


// 停用词列表
const stopWords = {
    en: new Set(["the", "is", "in", "at", "on", "and", "but", "or", "to", "of", "a", "an", "for", "with", "as", "by"]),
    zh: new Set(["的", "了", "是", "我", "在", "有", "和", "与", "对", "这", "那", "它", "人", "都"])
};

// 分词并过滤停用词
function tokenize(text: string, lang: string): string[] {
    let words: string[] = [];

    if (lang === "en") {
        words = text
            .split(/\s+/)
            .map(word => word.toLowerCase())
            .filter(word => !stopWords.en.has(word));
    } else if (lang === "zh") {
        words = nodejieba.cut(text).filter((word: string) => !stopWords.zh.has(word));
    }

    return words;
}

// 计算词频
function countWordFrequency(words: string[]): Map<string, number> {
    const frequencyMap = new Map<string, number>();

    words.forEach(word => {
        const count = frequencyMap.get(word) || 0;
        frequencyMap.set(word, count + 1);
    });

    return frequencyMap;
}

parentPort!.on("message", async (message) => {
    const { action, data: { meetId, langs } } = message;

    for (let lang of langs) {
        const speeches = await meetSpeechDao.findSpeechesByRoomAndLang(meetId, lang);

        let allText = speeches.map(speech => speech.speechText).join(" ");
        const words = tokenize(allText, lang);
        const wordFrequency = countWordFrequency(words);

        console.log(`词频统计 | ${lang}`, wordFrequency);

        parentPort!.postMessage({ lang, wordFrequency });
    }
});
