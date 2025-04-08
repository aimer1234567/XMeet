import { parentPort, workerData } from "worker_threads";
import nodejieba from "nodejieba";
import MeetSpeech from "../models/entity/MeetSpeech";
import * as fs from 'fs';

function loadStopwords(filePath: string): Set<string> {
  const stopwords = new Set<string>();
  const data = fs.readFileSync(filePath, 'utf-8');
  const lines = data.split('\n');
  lines.forEach(line => {
    const word = line.trim();
    if (word) {
      stopwords.add(word);
    }
  });
  return stopwords;
}
const stopwords = loadStopwords('stopwords_full.txt')
// 分词并过滤停用词
function tokenize(text: string, lang: string): string[] {
  let words: string[] = [];
  if (lang === "en") {
    words = text
      .split(/\s+/)
      .map((word) => word.toLowerCase())
      .filter((word) => !stopwords.has(word));
  } else if (lang === "zh") {
    words = nodejieba
      .cut(text)
      .filter((word: string) => !stopwords.has(word));
  }
  return words;
}

// 计算词频
function countWordFrequency(words: string[]) {
  const frequencyMap = new Map<string, number>();
  words.forEach((word) => {
    const count = frequencyMap.get(word) || 0;
    frequencyMap.set(word, count + 1);
  });
  const wordFrequencyArray = Array.from(frequencyMap.entries()).map(
    ([word, count]) => ({
      name: word,
      value: count,
    })
  );
  return wordFrequencyArray;
}

function splitTimeAndCountByMinutes(times: Date[]): { timeIntervals: string[], counts: number[] } {
  // 上述验证代码...
  
  // 将时间数组转换为时间戳（毫秒）
  const timestamps = times.map(time => time.getTime());

  // 找到最小时间戳
  const minTime = Math.min(...timestamps);

  // 计算每个时间与最小时间的分钟差
  const minutesFromStart = timestamps.map(timestamp => Math.floor((timestamp - minTime) / 60000));

  // 计算总的时间跨度，按分钟计算
  const maxMinutes = Math.max(...minutesFromStart);

  // 如果所有时间相同，直接返回
  if (maxMinutes === 0) {
    return { timeIntervals: ['0 - 10分钟'], counts: [times.length] };
  }

  // 计算每个区间的跨度（按分钟）
  const interval = Math.ceil(maxMinutes / 10); // 10份，按分钟计算

  // 初始化区间和计数数组
  const timeIntervals: string[] = [];
  const counts: number[] = Array(10).fill(0);

  // 构建时间区间（从0开始的相对分钟）
  for (let i = 0; i < 10; i++) {
    const startMinute = i * interval;
    const endMinute = (i + 1) * interval;
    timeIntervals.push(`${startMinute} - ${endMinute}分钟`);
  }

  // 遍历时间数组，统计每个时间属于哪个区间
  minutesFromStart.forEach(minutes => {
    const index = Math.floor(minutes / interval);

    // 确保最后一个时间点不会超出区间范围
    if (index >= 10) {
      counts[9]++; // 把最后一个时间点归到最后一个区间
    } else {
      counts[index]++;
    }
  });

  return { timeIntervals, counts };
}

parentPort!.on(
  "message",
  async (message: {
    action: string;
    data: { meetId: string; speechesLangMay: Map<string, MeetSpeech[]> };
  }) => {
    const {
      data: { meetId, speechesLangMay },
    } = message;
    let wordCloud: {
      lang: string;
      wordFrequencyArray: { value: string; count: number }[];
    }[];
    let durationPieChartById: { value:number; userId: string }[];
    let chatHeatMap:{ timeIntervals:string[], counts:number[] };
    {
      const wordFrequencyMay = new Map<string, any>();
      for (let lang of speechesLangMay.keys()) {
        let speeches: MeetSpeech[] = speechesLangMay.get(lang)!;
        let allText = speeches.map((speech) => speech.speechText).join(" ");
        const words = tokenize(allText, lang);
        const wordFrequencyArray = countWordFrequency(words);
        wordFrequencyMay.set(lang, wordFrequencyArray);
      }
      wordCloud = Array.from(wordFrequencyMay.entries()).map(
        ([lang, wordFreq]) => ({
          lang,
          wordFrequencyArray: wordFreq, // 直接使用原始结构
        })
      );
    }
    let speeches = speechesLangMay.values().next().value!;
    {
      let userSpeechCount = speeches
        .map((speech) => speech.userId) // 获取所有的 userId
        .reduce((countMap: { [key: string]: number }, userId: string) => {
          countMap[userId] = (countMap[userId] || 0) + 1; // 统计每个 userId 出现的次数
          return countMap;
        }, {} as { [key: string]: number });
      // 转换为所需格式 
      durationPieChartById = Object.entries(userSpeechCount).map(([userId, count]) => ({
        value: count,
        userId: userId,
      }));
    }
    {
      const speechesTimestamp = speeches.map((speech) => speech.timestamp);
      chatHeatMap = splitTimeAndCountByMinutes(speechesTimestamp);
    }
    parentPort!.postMessage({
      meetId,
      data: { wordCloud, chatHeatMap, durationPieChartById },
    });
  }
);
