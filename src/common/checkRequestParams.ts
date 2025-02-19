/**
 * 检验请求参数是否都存在，且数据类型符合数据模型。
 * 如果检验成功则将参数传递到target中，失败则抛出异常
 * @param target 数据模型
 * @param reqBody express的req.body对象
 */
export default function checkRequestParams(target: any, reqBody: any): void {
    // 遍历数据模型中的每个字段
    for (const key in target) {
      // 如果模型有该字段，但请求体中没有
      if (!(key in reqBody)) {
        throw new Error(`Missing parameter: ${key}`);
      }
  
      const expectedType = typeof target[key]; // 获取预期的字段类型
      const actualType = typeof reqBody[key]; // 获取请求体字段的实际类型
  
      // 如果类型不匹配
      if (expectedType !== actualType) {
        throw new Error(`Type mismatch for parameter: ${key}. Expected ${expectedType}, got ${actualType}`);
      }
  
      // 如果字段是数组类型，进一步检查其每个元素的类型
      if (Array.isArray(target[key]) && Array.isArray(reqBody[key])) {
        const expectedArrayType = typeof target[key][0]; // 假设数组中的所有元素都是相同类型
        for (const item of reqBody[key]) {
          if (typeof item !== expectedArrayType) {
            throw new Error(`Array element type mismatch for parameter: ${key}`);
          }
        }
      }
    }
  
    // 如果没有任何错误，成功地将参数传递到 target
    // 使用 Object.assign 或者直接修改 target，取决于你的需求
    Object.assign(target, reqBody);
  }
  