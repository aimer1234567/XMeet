from huggingface_hub import snapshot_download
# 下载模型从huggingface_hub中获取模型
# 设定本地保存目录
local_dir = "./model/Helsinki-NLP/opus-mt-zh-en"

# 下载整个模型
snapshot_download(repo_id="Helsinki-NLP/opus-mt-zh-en", local_dir=local_dir)

print(f"模型已下载到 {local_dir}")
