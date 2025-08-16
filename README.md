# 多人视频会议系统（基于 WebRTC + SFU）

本系统基于 **WebRTC** 和 **SFU 架构** 实现高性能多人视频会议，支持跨平台音视频实时通信，同时集成语音识别与实时翻译功能，并通过大语言模型生成会议摘要。
项目[前端地址](https://github.com/aimer1234567/Xmeet-fronted)

---

## 系统概述

- **多用户实时协作平台**  
  - WebSocket 全双工通信保证用户端与服务端数据同步  
  - 支持麦克风、摄像头和屏幕共享  

- **跨语言沟通**  
  - 集成 **Vosk** 语音识别器  
  - 结合 **MarianMT** 翻译模型，实现会议界面 **实时翻译字幕**  

- **会议数据分析**  
  - 对语音识别文本进行数据分析与可视化  
  - 调用大语言模型接口生成会议内容总结  

---

## 技术架构

### 前端
- Vue.js  

### 后端
- Node.js + TypeScript  
- B/S 架构  

### 实时通信
- **WebRTC**：音视频点对点传输  
- **WebSocket**：实时数据同步  
- **SFU（选择性转发单元）**：低延迟、多用户负载优化  

---

## 核心技术

### 1. WebRTC
WebRTC（Web Real-Time Communication）是谷歌开源的浏览器实时通信技术框架。  
- 提供音视频采集、编解码、渲染、网络传输、Session 管理等模块  
- 支持 Opus、ISAC、G.711 音频编解码器，VP8 视频编解码器  
- 使用 STUN/TURN/ICE 实现 NAT 穿透  
- 通过 **DTLS + SRTP** 协议保障音视频加密传输  

**WebRTC 通信协议栈示意：**  
- STUN：获取公网映射地址  
- TURN：中继服务器，解决 P2P 失败问题  
- ICE：多路径候选选择，实现稳定连接  

### 2. SFU 架构
选择性转发单元（SFU）适用于多人实时通信场景。  
- 用户端只需与媒体服务器建立连接，减少客户端负担  
- 媒体服务器直接转发媒体流，无需解码和混合  
- 与 MCU 相比，降低服务器性能压力，延迟低，扩展性好  

### 3. SFU 开源框架选择
调研了 Jitsi Meet、Janus Gateway、Medooze、Kurento/OpenVidu 和 **mediasoup**：
- Kurento 高延迟、带宽限制  
- Jitsi 大型会议传输不稳定  
- Janus/Medooze/mediasoup 在大量用户下性能较优  
- **最终选择 mediasoup**：完善文档、社区活跃、性能高  

### 4. mediasoup 框架
mediasoup 是高性能 **WebRTC SFU 框架**，基于 Node.js + C++ 实现：
- **Worker**：底层 C++ 线程，处理媒体数据  
- **Router**：管理 Producer 和 Consumer，路由转发 RTP 包  
- **Transport**：用户端与 Router 之间的媒体传输通道  
- **Producer**：媒体发送端  
- **Consumer**：媒体接收端  

**mediasoup 工作原理：**  
1. 初始化 Worker 线程处理媒体流  
2. Router 与用户端建立 SRTP 连接  
3. 通过 Transport 发送和接收媒体流，实现会议中多用户的音视频共享  

---

## 核心功能

1. 创建即时会议  
2. 预约会议  
3. 加入会议  
4. 管理会议（麦克风、摄像头、屏幕共享）  
5. 实时字幕  
6. 会议数据分析与可视化  
7. 会议内容智能摘要  

---

## 系统性能

- 视频播放流畅  
- 实时字幕延迟低  
- 支持多用户、大规模会议  
- 媒体服务器负载低  
