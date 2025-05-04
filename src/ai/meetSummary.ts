import { Worker } from "worker_threads";
import { WorkerTaskQueue } from "../utils/workerTaskQueue";
import path from "path";
import meetRoomRecordDao from "../dao/meetRoomRecordDao";
import meetSpeechDao from "../dao/MeetSpeechDao";
import { userDao } from "../dao/userDao";

class MeetSummaryUtil {
  meetSummaryWorker!: Worker;
  workerTaskQueue = new WorkerTaskQueue<{ action: string; data: any }>();
  initMeetSummaryService() {
    this.meetSummaryWorker = new Worker(
      path.join(__dirname, "./meetSummaryWorker.js")
    );
    this.workerTaskQueue.setWorker(this.meetSummaryWorker);
    this.meetSummaryWorker.on(
      "message",
      async ({
        meetId,
        data: { wordCloud, durationPieChartById, chatHeatMap,intelligentSummary},
      }) => {
        this.workerTaskQueue.handleNextTaskDone();
        const durationPieChart = await Promise.all(
          durationPieChartById.map(async (item: any) => {
            let user = await userDao.selectById(item.userId);
            return { value: item.value, name: user.name };
          })
        );
        meetRoomRecordDao.updateSummary(
          meetId,
          wordCloud,
          durationPieChart,
          chatHeatMap,
          intelligentSummary
        );
      }
    );
    this.meetSummaryWorker.on("error", (err) => {
      this.workerTaskQueue.handleNextTaskDone();
      console.log(err);
    });
    this.meetSummaryWorker.on("exit", (code) => {
      // TODO:
    });
  }
  async summary(meetId: string) {
    const langs = ["zh", "en"]; // TODO: 目前由于是两种语言，所以就直接写死了，后面可以改成动态的
    const speechesLangMay = new Map();
    for (const lang of langs) {
      let speeches = await meetSpeechDao.findSpeechesByRoomAndLang(
        meetId,
        lang
      );
      speechesLangMay.set(lang, speeches);
    }
    this.workerTaskQueue.addTaskToQueue({
      action: "summary",
      data: { meetId, speechesLangMay },
    });
  }
}

export default new MeetSummaryUtil();
