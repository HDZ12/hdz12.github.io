---
title: K次取反后最大化的数组和
index: true
article: true
category: 
  - 贪心算法
tags:
  - easy
  - 贪心算法
---
## 题目链接
[1005.K次取反后最大化的数组和](https://leetcode.cn/problems/maximize-sum-of-array-after-k-negations/)

## 解题思路
让绝对值大的负数变为正数,全是正数时只更新最小的。
## 代码实现
```java
class Solution {
    public int largestSumAfterKNegations(int[] nums, int k) {
        Arrays.sort(nums);

        int i = 0;

        while (i < nums.length && nums[i] < 0 && k > 0) {
            nums[i] = -nums[i];
            k--;
            i++;
        }

        Arrays.sort(nums);

        if (k % 2 == 1) {
            nums[0] = -nums[0];
        }

        int sum = 0;

        for (int num : nums) {
            sum += num;
        }

        return sum;
    }
}
```
## 复杂度
时间复杂度: $O(nlogn)$
空间复杂度: $O(1)$
