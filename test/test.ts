  import AppDataSource from "../src/common/config/database";
  import MeetRoomDao from "../src/dao/meetRoomDao";
  import sourceMapSupport from "source-map-support";
  import meetSpeechDao from "../src/dao/MeetSpeechDao";
  import MeetSpeech from "../src/models/entity/MeetSpeech";
import { AIClient } from "../src/ai/aiClient";
async function name() {
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
    let intelligentSummary:{ lang: string; summary: string }[]
    const langs = ["zh", "en"]; // TODO: 目前由于是两种语言，所以就直接写死了，后面可以改成动态的
    const speechesLangMay = new Map();
    for (const lang of langs) {
      let speeches = await meetSpeechDao.findSpeechesByRoomAndLang(
        "150f86f9-c0f0-483f-b2d8-689b7488ddfe",
        lang
      );
      speechesLangMay.set(lang, speeches);
    }
    const aiClient=new AIClient()
    { 
      intelligentSummary=new Array<{ lang: string; summary: string }>();
      for (let lang of speechesLangMay.keys()){
        let texts:string[]=new Array<string>();
        let speeches: MeetSpeech[]=speechesLangMay.get(lang)!
        let text:string=""
        let tempText:string
        let ts=lang==="zh"?"某用户发言:":"A user speaks:"
        speeches.forEach((speech)=>{
          tempText=text
          text=text+ts+speech.speechText+"\n"
          if(text.length>=7000){
            texts.push(tempText)
            text=ts+speech.speechText+"\n"
          }
        })
        texts.push(text)
        console.log("会议转录"+texts)
        let summary=await aiClient.intelligentSummary(texts,lang as 'zh' | 'en')
        intelligentSummary.push({lang,summary})
      }
      console.log("会议总结"+JSON.stringify(intelligentSummary))
    }
}
name()