---
title: AgentTool
index: true
article: true
category:
  - agent
tags:
  - 工具调用
  - agent开发
---


## 工具调用理论基础

### Function Calling
Function Calling 就是让大模型把用户的话转换成“要调用哪个函数、传什么参数”的结构化指令。
Function Call 需要先定义函数，向 LLM 描述函数的用途、输入参数格式（JSON Schema）：

```json
{
  "name": "get_current_weather",
  "description": "获取指定城市的天气",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "城市名称"
      },
      "unit": {
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["city"]
  }
}
```
当用户提问“北京今天需要带伞吗？”

→ LLM 识别到意图需要调用 get_current_weather

→ 并生成结构化参数：{"city": "北京", "unit": "celsius"}

然后执行 get_current_weather 函数调用天气 API，获取真实数据：{"temp": 25, "rain_prob": 30%}，然后将结果交回LLM，生成最终回复：“北京今天25°C，降水概率30%，建议带伞。”
### MCP
MCP 协议旨在解决大型语言模型（LLM）与外部数据源、工具间的集成难题，被比喻为“AI 应用的 UＳＢ-C 接口“。通过标准化通信协议，将传统的“M×N集成问题”（即多个模型与多个数据源的点对点连接）转化为“M+N模式”，大幅降低开发成本。

## 工具的渐进式披露
- 把工具绑定在具体的skill上做渐进式披露
- 动态路由披露
- subgraph披露
- 工具检索披露

## Agent工具注册
### 全部注册
一次性注册，工具量少的时候可以采用。
### 按需注册
工具召回。
```python
class ToolRetriever:
    def __init__(self,tools:list[Tool])
        self.tools = tools
    def retrieve(self,query: str,top_k: int = 5) -> list[Tool] :
           # 多级召回策略
        keyword_results = self._keyword_match(query)      # 关键词匹配
        semantic_results = self._semantic_match(query)    # 语义匹配
        rule_results = self._rule_match(query)            # 规则匹配
        
        # 融合排序
        returnself._fusion_ranking(
            keyword_results, 
            semantic_results, 
            rule_results,
            top_k
        )
```
召回率可能不足，可能遗漏正确工具。
### 混合注册
核心工具始终注册，其余工具召回。
## 工具描述
三层架构，短描述，中描述，完整描述。
```python
class ToolDescriptor:
    def __init__(self):
        self.short_desc = "获取天气"      # 列表展示 <20字
        self.medium_desc = "根据城市名称获取实时天气"  # 召回匹配 <50字
        self.full_desc = """获取指定城市的天气信息
    
    支持城市：北京、上海、广州、深圳等
    返回：温度、湿度、风力、空气质量
    示例：get_weather(city="北京")"""  # 深度理解 <200字
```
短描述用于快速展示，中描述用于语义召回，完整描述用于模型深度理解。
## 工具分类设计
```python
class ToolCategory:
    # 业务域分类
    BUSINESS_DOMAIN = ["电商", "社交", "出行", "工具"]
    
    # 操作类型分类
    OPERATION_TYPE = ["查询", "创建", "更新", "删除"]
    
    # 敏感性分类
    SENSITIVITY = ["公开", "隐私", "敏感"]
```
## 工具的benchmark
- 首次调用准确率
- 最终调用准确率
- Token消耗
## 召回率与准确率平衡
- 初始召回候选稍多（top 10），由模型最终选择引入“意图澄清”机制，
- 当不确定时询问用户
- 基于历史使用数据，动态调整各工具的召回权重
## 工具执行失败
传统编程中，代码明确知道失败并可预测处理；而在 Agent 场景中，LLM 需要"理解"错误文本后决定下一步，这个过程不可预测。
### 方案一:参数自动转换
```python
class WeatherTool:
    def __init__(self):
        self.param_mapping = {
            "city": "city_name",
            "c": "city_name"
        }
        self.city_normalization = {
            "北京": "beijing",
            "上海": "shanghai"
        }      
    def normalize_params(self, params: dict) -> dict:
        normalized = {}
        for key, value in params.items():
            mapped_key = self.param_mapping.get(key, key)
            if key == "city"and value in self.city_normalization:
                value = self.city_normalization[value]
            normalized[mapped_key] = value
        return normalized
```
### 方案二：强化结果校验层
```python
class ToolResultValidator:
    def validate(self, result: ToolResult) -> ValidationResult:
        if result.is_success:
            return ValidationResult(valid=True, action="continue")
        
        if self.is_retryable_error(result.error):
            return ValidationResult(
                valid=False,
                action="retry",
                reason=result.error.message
            )
        
        return ValidationResult(
            valid=False,
            action="fail",
            error_message=self.format_error(result.error)
        )
    
    def is_retryable_error(self, error: Error) -> bool:
        return error.code in [500, 502, 503, 504]
```
### 方案三：重试策略系统控制（推荐）
```python
class RetryableToolExecutor:
    def__init__(self, max_retry: int = 2):
        self.max_retry = max_retry
    
    async def execute_with_retry(self, tool: Tool, params: dict):
        for attempt in range(self.max_retry + 1):
            result = await tool.execute(params)
            if result.is_success:
                return result
            
            if not self.is_retryable(result.error):
                return self.format_failure_result(result.error)
        
        return self.format_failure_result(
            f"工具执行失败，已重试 {self.max_retry} 次"
        )
```
### 方案四：连续失败终止机制
```python 
class FailureTracker:
    def__init__(
        self,
        max_consecutive_failures: int = 3,
        failure_window: int = 300
    ):
        self.max_consecutive_failures = max_consecutive_failures
        self.failure_history: list[FailureRecord] = []
    
    def should_terminate(self) -> bool:
        recent_failures = self.get_recent_failures()
        returnlen(recent_failures) >= self.max_consecutive_failures
    
    def get_recent_failures(self) -> list[FailureRecord]:
        return [
            f for f inself.failure_history
            if f.timestamp > time.time() - self.failure_window
        ]
```
为什么是 3 次：
- 用户体验：用户等待时间不宜超过合理范围（网络请求通常 ms 级，3 次重试意味着数秒到十数秒的等待）
- 资源保护：防止无限重试被滥用，消耗系统资源
- 统计意义：连续 3 次失败通常意味着系统性问题，单次重试难以解决
### 错误信息结构化设计
```python
class ToolError:
    def__init__(
        self,
        error_type: str,
        error_message: str,
        error_code: int,
        fix_suggestion: str | None = None,
        can_retry: bool = False
    ):
        self.error_type = error_type
        self.error_code = error_code
        self.fix_suggestion = fix_suggestion
        self.can_retry = can_retry
    
    def to_message(self) -> str:
        parts = [
            f"错误类型: {self.error_type}",
            f"错误代码: {self.error_code}"
        ]
        if self.fix_suggestion:
            parts.append(f"修复建议: {self.fix_suggestion}")
        parts.append(
            "可重试"ifself.can_retry else"不建议重试"
        )
        return" | ".join(parts)
```
| 错误类型 | 是否可重试 | LLM 应该如何处理 | 原因说明 |
|---|---|---|---|
| 网络超时 | 是 | 重试一次 | 可能是临时网络波动 |
| 503 服务不可用 | 是 | 等待一段时间后重试 | 服务可能暂时过载或不可用 |
| 401 认证失败 | 否 | 提示用户检查 API Key、Token 或权限配置 | 认证信息错误，重试通常无效 |
| 422 参数错误 | 否 | 尝试修正参数格式或提示用户补充正确信息 | 请求参数不符合工具要求 |
| 429 频率限制 | 是 | 等待一段时间后再重试，必要时降低调用频率 | 请求过于频繁，触发限流 |
| 500 服务器错误 | 是 | 可以重试一次；若仍失败，进入降级或失败兜底 | 服务端内部异常，可能是暂时性问题 |
## 典型失败场景
### 场景一：假装没看到失败

**现象：**  
LLM 收到错误信息后，忽略它并继续往下走。

**根因：**  
模型可能把错误信息当作噪声过滤掉了，或者把错误码误解为某种响应内容。

---

### 场景二：把失败解读成成功

**现象：**  
模型在错误信息中提取了看似合理的内容，并当作成功结果使用。

**根因：**  
训练数据中可能存在带 `error` 字段但实际返回正常结果的 API，导致模型学会忽略上下文。

---

### 场景三：无效参数导致失败，越修越错

**现象：**  
LLM 尝试“修复”参数，但越修越离谱。

**根因：**  
模型缺乏对工具 schema 的准确理解，修复往往适得其反。