from fastapi import FastAPI
from transformers import MarianMTModel, MarianTokenizer  #翻译模型
from deepmultilingualpunctuation import PunctuationModel   #给英文及其他语言添加标点符号
import paddlehub as hub  #百度飞桨，给中文添加标点符号
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有地址发起跨域请求
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class TranslationRequest(BaseModel):
    text: str
    lang: str
    
class Translate():
    def __init__(self,src_lang='zh',tgt_lang='en'):
        # 定义模型名称
        self.model_name=f'Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}'
        # 加载预训练模型和tokenizer
        self.model = MarianMTModel.from_pretrained(self.model_name)
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        
    def translate_text(self,text:str):       
        # 对输入文本进行编码
        inputs = self.tokenizer(text, return_tensors="pt", padding=True)
        
        # 执行翻译
        translated = self.model.generate(**inputs)
        
        # 解码并返回翻译结果
        translated_text = self.tokenizer.decode(translated[0], skip_special_tokens=True)
        
        return translated_text

translateZhEn:Translate=Translate()
translateEnZh:Translate=Translate(src_lang="en",tgt_lang='zh')
model_zh = hub.Module(
    name='auto_punc',
    version='1.0.0')
model_en = PunctuationModel()

@app.post("/translate")
async def root(translationRequest: TranslationRequest):
    text=translationRequest.text
    punctuatedText:str
    if(translationRequest.lang=='zh'):
        punctuatedText=model_zh.add_puncs(text)
    else:
        punctuatedText=model_en.restore_punctuation(text)
    if(translationRequest.lang=='zh'):
        translateResult=translateZhEn.translate_text(punctuatedText)
        return {"translateResult":translateResult,"punctuatedText":punctuatedText}
    else:
        translateResult=translateEnZh.translate_text(punctuatedText)
        return {"translateResult":translateResult,"punctuatedText":punctuatedText}

if __name__ == "__main__":
    import uvicorn
    os.environ["CUDA_VISIBLE_DEVICES"] = "0"
    uvicorn.run(app, host="0.0.0.0", port=8001)