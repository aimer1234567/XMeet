export default class Result<T>{
    private code:0|1
    private data:T
    private msg:string | undefined
    private constructor(code:0|1,data:T,msg?:string){
        this.code=code
        this.data=data
        if(msg){
            this.msg=msg
        }
    }
    static succuss<T>(data?:T):Result<T | null>{
        if(data){
            return new Result(1,data)
        }else{
            return new Result(1,null)
        }
    }
    static error(msg:string){
        return new Result(0,null,msg)
    }
}