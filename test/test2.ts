function splitTimeAndCountByMinutes(times: Date[]): { timeIntervals: string[], counts: number[] } {
  // 上述验证代码...
  
  // 将时间数组转换为时间戳（毫秒）
  const timestamps = times.map(time => time.getTime());

  // 找到最小时间戳
  const minTime = Math.min(...timestamps);

  // 计算每个时间与最小时间的分钟差
  const minutesFromStart = timestamps.map(timestamp => Math.floor((timestamp - minTime) / 60000));

  // 计算总的时间跨度，按分钟计算
  const maxMinutes = Math.max(...minutesFromStart);

  // 如果所有时间相同，直接返回
  if (maxMinutes === 0) {
    return { timeIntervals: ['0 - 10分钟'], counts: [times.length] };
  }

  // 计算每个区间的跨度（按分钟）
  const interval = Math.ceil(maxMinutes / 10); // 10份，按分钟计算

  // 初始化区间和计数数组
  const timeIntervals: string[] = [];
  const counts: number[] = Array(10).fill(0);

  // 构建时间区间（从0开始的相对分钟）
  for (let i = 0; i < 10; i++) {
    const startMinute = i * interval;
    const endMinute = (i + 1) * interval;
    timeIntervals.push(`${startMinute} - ${endMinute}分钟`);
  }

  // 遍历时间数组，统计每个时间属于哪个区间
  minutesFromStart.forEach(minutes => {
    const index = Math.floor(minutes / interval);

    // 确保最后一个时间点不会超出区间范围
    if (index >= 10) {
      counts[9]++; // 把最后一个时间点归到最后一个区间
    } else {
      counts[index]++;
    }
  });

  return { timeIntervals, counts };
}


let data = [
  new Date(2025, 3, 7, 14, 32, 10, 123), // 第一个时间
  new Date(2025, 3, 7, 14, 32, 10, 123),
  new Date(2025, 3, 7, 14, 43, 10, 123),
  new Date(2025, 3, 7, 14, 32, 10, 123), // 第二个时间
  new Date(2025, 3, 7, 14, 33, 11, 123)  // 第三个时间
];

console.log(splitTimeAndCountByMinutes(data));
