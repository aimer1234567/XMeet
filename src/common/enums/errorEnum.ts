export enum ErrorEnum{
    UserIsNone="用户不存在",
    PasswordError="密码错误",
    VerifyError="身份验证错误",
    RoomNotExist="房间不存在",
    RoomIsExist="房间已存在",
    PeerNotExist="用户不存在",
    WebSocketServerNotInit="websocket服务没有初始化",
    UserInRoom="用户已加入会议",
    UserNotInRoom="用户不在会议中",
    UserIsRoomOwner="用户当前已经创建了会议",
    NoPermission="没有权限",
    SQLError="数据库错误",
    AppointMeetNumberLimit="预约会议数量已达上限",
    TaskExist="任务已存在",
    RoomUserLimit="房间用户数已达上限",
    MeetNotStart="会议未开始"
} 