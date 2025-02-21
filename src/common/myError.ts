export default class myError extends Error {
    constructor(public msg:string){
        super(msg)
        this.name = "myError"
    }
}