import {Worker} from 'worker_threads';
import { WorkerTaskQueue } from './workerTaskQueue';
import path from 'path';
class meetSummaryUtil{
    meetSummaryWorker!:Worker
    workerTaskQueue=new WorkerTaskQueue<{action:string,data:any}>
    initMeetSummaryService(){
        this.meetSummaryWorker=new Worker(path.join(__dirname,'./meetSummaryWorker.js'))
        this.workerTaskQueue.setWorker(this.meetSummaryWorker)
        this.meetSummaryWorker.on('message',()=>{
            this.workerTaskQueue.handleNextTaskDone()

        })
        this.meetSummaryWorker.on('error',(err)=>{
            console.log(err)
        })
        this.meetSummaryWorker.on('exit',(code)=>{

        })
    }
    summary(meetId:string){
        const langs = ['zh','en']   // TODO: 目前由于是两种语言，所以就直接写死了，后面可以改成动态的
        this.workerTaskQueue.addTaskToQueue({action:'summary',data:{meetId,langs}})
    }
}