import { Type, Expose } from "class-transformer";
export class CreateMeetRoomReq {
  @Type(() => Date)
  startTime: Date;
  durationMinutes: number;
  name: string;
  remark: string;
  numLimit: string;
  constructor(
    startTime: Date,
    durationMinutes: number,
    name: string,
    remark: string,
    numLimit: string
  ) {
    this.startTime = startTime;
    this.durationMinutes = durationMinutes;
    this.name = name;
    this.remark = remark;
    this.numLimit = numLimit;
  }
}

export class CreateMeetRoomInstantReq {
  constructor(
    public name: string,
    public remark: string,
    public numLimit: number
  ) {}
}

export class QueryMeetRoomRecordReq {
  constructor(
    public meetRoomName: string,
    public startTime: Date,
    public endTime: Date,
    public page: number,
    public pageSize: number
  ) {}
}
