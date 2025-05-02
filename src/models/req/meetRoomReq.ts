import { Type, Expose } from "class-transformer";
export class CreateMeetRoomReq {
  @Type(() => Date)
  startTime: Date;
  durationMinutes: number;
  name: string;
  remark: string;
  password: string;
  constructor(
    startTime: Date,
    durationMinutes: number,
    name: string,
    remark: string,
    password: string
  ) {
    this.startTime = startTime;
    this.durationMinutes = durationMinutes;
    this.name = name;
    this.remark = remark;
    this.password = password;
  }
}

export class CreateMeetRoomInstantReq {
  constructor(
    public name: string,
    public remark: string,
    public password: string
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
