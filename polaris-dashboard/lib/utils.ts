/**
 * 액세서리 데이터에서 vehicle_engine_speed와 같은 비액세서리 속성을 필터링하는 함수
 * @param data 필터링할 액세서리 데이터 배열
 * @returns 필터링된 액세서리 데이터 배열
 */
export function filterNonAccessories<T extends { property_name: string }>(data: T[]): T[] {
    if (!Array.isArray(data)) return [];
  
    const nonAccessoryProps = [
        'vehicle_engine_speed',
    // 추후 다른 비액세서리 속성이 발견되면 여기에 추가
    ];
  
    return data.filter(item => !nonAccessoryProps.includes(item.property_name));
}

/**
 * 액세서리 사용량을 집계하는 함수
 * @param data 집계할 액세서리 데이터
 * @returns 액세서리별 사용 횟수 맵
 */
export function getAccessoryUsageCounts<T extends { property_name: string }>(data: T[]): Record<string, number> {
    const filtered = filterNonAccessories(data);

    return filtered.reduce((acc: Record<string, number>, item) => {
        const { property_name } = item;

        if (!acc[property_name]) {
            acc[property_name] = 0;
        }
        acc[property_name]++;

        return acc;
    }, {});
}

/**
 * 액세서리 사용량 순위를 계산하는 함수
 * @param data 액세서리 데이터
 * @returns 사용량 내림차순으로 정렬된 액세서리 이름과 사용 횟수 배열
 */
export function getAccessoryRanking<T extends { property_name: string, usage_count: number }>(data: T[]): { name: string, count: number }[] {
    const filtered = filterNonAccessories(data);
  
    // 액세서리별로 사용량 합산
    const usageCounts: Record<string, number> = {};

    for (const item of filtered) {
        if (!usageCounts[item.property_name]) {
            usageCounts[item.property_name] = 0;
        }
        usageCounts[item.property_name] += item.usage_count;
    }
  
    // 사용량 기준 내림차순 정렬
    return Object.entries(usageCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
} 