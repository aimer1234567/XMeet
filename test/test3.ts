let m=["user1", "user2", "user1"].reduce((countMap: { [key: string]: number }, userId: string) => {
    countMap[userId] = (countMap[userId] || 0) + 1; // 统计每个 userId 出现的次数
    return countMap;
  }, {} as { [key: string]: number }); // 类型断言

console.log(m);