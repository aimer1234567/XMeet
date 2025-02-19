function a(){
  throw new Error("test")
}
function b(){
  try{
    a()
  }catch(e){
    throw new Error("test2")
  }
}

try{
  b()
}catch(e){
  console.log("wdwd")
}