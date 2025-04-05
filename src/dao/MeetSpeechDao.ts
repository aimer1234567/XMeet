import AppDataSource from "../common/config/database"
import MeetSpeech from "../models/entity/MeetSpeech"
class MeetSpeechDao{
    private meetSpeechRepository=AppDataSource.getRepository(MeetSpeech)
    async insertSpeech(meetSpeech:MeetSpeech){
        return await this.meetSpeechRepository.save(meetSpeech)
    }
}

export default new MeetSpeechDao()