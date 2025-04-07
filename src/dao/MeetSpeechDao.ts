import AppDataSource from "../common/config/database";
import MeetSpeech from "../models/entity/MeetSpeech";
class MeetSpeechDao {
  private meetSpeechRepository = AppDataSource.getRepository(MeetSpeech);
  async insertSpeech(meetSpeech: MeetSpeech) {
    return await this.meetSpeechRepository.save(meetSpeech);
  }
  // 根据房间号和语言查询语音记录
  async findSpeechesByRoomAndLang(meetId: string, lang: string) {
    return await this.meetSpeechRepository.find({
      where: {
        meetId: meetId,
        lang: lang,
      },
      order: {
        timestamp: "ASC", // 按时间戳升序排序，可以调整为 'DESC' 按需
      },
    });
  }
}

export default new MeetSpeechDao();
