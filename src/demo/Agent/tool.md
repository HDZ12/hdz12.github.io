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

## 工具编排
### 方案一：Prompt 驱动编排（最初级）
将编排逻辑直接写在 Agent 的提示词中，让 LLM 决定下一步调用什么。
```java
ORCHESTRATION_PROMPT = """
你是一个会议预订助手，需要完成以下步骤：
1. 首先调用 check_room_availability 查询会议室可用时间
2. 然后调用 check_attendee_schedule 查询参与人日程
3. 接着调用 create_meeting 创建会议室
4. 最后调用 send_invite 发送邀请

每一步的输出会影响下一步的输入，请确保正确传递数据。
如果某一步失败，请尝试恢复或告知用户。
"""
```
优点：实现简单，无需额外逻辑灵活性高，LLM 可以根据情况调整执行顺序适合快速验证和简单场景
缺点：不可预测，LLM 可能跳过步骤或顺序错误调试困难，难以追踪状态格式转换依赖 LLM，容易出错失败处理不确定
适用场景：工具数量少（<3个）、流程简单、对准确性要求不高的探索阶段。
### 方案二：ReAct 模式（主流基础方案）
ReAct（Reasoning + Acting）是一种让 LLM 在推理过程中决定下一步行动的模式。Agent 在每一步都会"思考"当前状态，然后决定调用哪个工具。
```python
class ReActAgent:
    def__init__(self, tools: list[Tool]):
        self.tools = {t.name: t for t in tools}
    
    asyncdefexecute(self, user_request: str, max_steps: int = 10):
        observation = None
        thought = f"用户请求：{user_request}，我需要完成订会议室的任务"
        
        for step inrange(max_steps):
            # LLM 推理下一步应该做什么
            action = awaitself.llm.think(thought, observation, self.available_tools())
            
            if action.type == "tool_call":
                # 执行工具
                result = awaitself.tools[action.tool_name].execute(action.parameters)
                observation = f"工具 {action.tool_name} 返回：{result}"
                thought += f"\n上一步：{observation}"
            elif action.type == "finish":
                return action.final_response
        
        return"任务超时，未能完成"
```
优点：实现相对简单，有成熟框架支持（LangChain、AutoGen 等）灵活性高，能处理动态变化的情况支持动态工具选择
缺点：执行路径不确定，难以预测下一步状态管理依赖上下文，可能膨胀失败处理仍不可控，可能无限循环
适用场景：中小规模生产环境、需要一定灵活性的场景。
### 方案三：Workflow / DAG 编排（工程级方案）
使用独立的工作流引擎来控制工具调用顺序、状态传递和错误处理。基于 DAG（有向无环图）定义工具执行依赖关系。
```python
class WorkflowEngine:
    def__init__(self):
        self.steps = []
        self.state = {}
    
    defadd_step(self, tool: Tool, input_map: dict, output_key: str, depends_on: list[str] = None):
        self.steps.append(WorkflowStep(
            tool=tool,
            input_map=input_map,
            output_key=output_key,
            depends_on=depends_on or []
        ))
    
    async def execute(self) -> WorkflowResult:
        # 按依赖顺序执行
        executed = set()
        while len(executed) < len(self.steps):
            ready_steps = [s for s inself.steps if s.name notin executed 
                          andall(d in executed for d in s.depends_on)]
            
            for step in ready_steps:
                inputs = self._prepare_inputs(step.input_map)
                result = await step.tool.execute(inputs)
                
                if result.is_success:
                    self.state[step.output_key] = result.data
                    executed.add(step.name)
                else:
                    return self._handle_failure(step, result)
        
        return WorkflowResult(success=True, state=self.state)
```
优点：执行顺序确定可控状态管理清晰可见失败处理机制完善支持并行执行（DAG 天然支持）便于调试和监控
缺点：实现复杂度较高灵活性较差，修改流程需要改代码需要维护状态存储
适用场景：生产环境、需要确定性执行、复杂流程、可靠性的场景。
### 方案四：LLM + Workflow 混合编排（推荐方案）
结合工作流引擎和 LLM 决策的优势，引擎控制流程，LLM 处理细节。
```python
class WorkflowEngine:
    def__init__(self):
        self.steps = []
        self.state = {}
    
    defadd_step(self, tool: Tool, input_map: dict, output_key: str, depends_on: list[str] = None):
        self.steps.append(WorkflowStep(
            tool=tool,
            input_map=input_map,
            output_key=output_key,
            depends_on=depends_on or []
        ))
    
    async def execute(self) -> WorkflowResult:
        # 按依赖顺序执行
        executed = set()
        while len(executed) < len(self.steps):
            ready_steps = [s for s inself.steps if s.name notin executed 
                          andall(d in executed for d in s.depends_on)]
            
            for step in ready_steps:
                inputs = self._prepare_inputs(step.input_map)
                result = await step.tool.execute(inputs)
                
                if result.is_success:
                    self.state[step.output_key] = result.data
                    executed.add(step.name)
                else:
                    returnself._handle_failure(step, result)
        
        return WorkflowResult(success=True, state=self.state)
```
优点：结合确定性和灵活性流程可控，细节灵活适合复杂业务场景失败处理可精确控制
缺点：实现复杂度最高需要协调两个系统
适用场景：大型复杂系统、需要流程标准化同时保持一定灵活性的场景。推荐用于生产环境。
## 工具间数据传递
### 工具间数据传递机制
工具间数据传递是走 Agent 的上下文还是独立的状态存储？
```python
# 方案A：上下文传递（通过Prompt）
class ContextPassingOrchestrator:
    def__init__(self):
        self.context = []
    
    async def execute_step(self, tool: Tool, context: list):
        # 将历史步骤的结果拼接到Prompt中
        prompt = self._build_prompt(tool, context)
        result = await tool.execute(prompt)
        context.append(result)
        return context

# 方案B：独立状态存储
class StateBasedOrchestrator:
    def__init__(self):
        self.state = {}  # 独立状态存储
    
    async def execute_step(self, tool: Tool):
        # 从状态存储中取数据
        inputs = self._prepare_inputs(tool.required_params)
        
        result = await tool.execute(inputs)
        
        # 存到状态存储
        self.state[tool.name] = result.data
        
        return result
```
生产环境使用独立状态存储，开发简单场景可用上下文传递。
### 格式转换层设计
不同工具输出格式不统一，需要一个转换层来处理：
```python
class DataTransformer:
    def__init__(self):
        self.transformers = {
            "check_room_availability": self._transform_room_list,
            "check_attendee_schedule": self._transform_calendar,
            "create_meeting": self._transform_meeting,
        }
    
    deftransform(self, tool_name: str, output: Any) -> dict:
        transformer = self.transformers.get(tool_name)
        if transformer:
            return transformer(output)
        return output
    
    def_transform_room_list(self, output: list) -> dict:
        # 统一转换为标准格式
        return {
            "available_rooms": [
                {
                    "room_id": room["id"],
                    "room_name": room["name"],
                    "available_slots": room["time_slots"]
                }
                for room in output
            ]
        }
    
    def_transform_calendar(self, output: dict) -> dict:
        return {
            "busy_times": output.get("events", []),
            "preferred_times": self._find_available_slots(output)
        }
```
### 失败处理与补偿机制
```python
class CompensationManager:
    def__init__(self):
        self.compensations = {
            "create_meeting": self._undo_create_meeting,
            "send_invite": self._undo_send_invite,
        }
    
    async def handle_failure(self, failed_step: str, state: dict):
        # 已执行的步骤需要补偿
        executed_steps = self._get_executed_steps(failed_step)
        
        for step inreversed(executed_steps):
            compensation = self.compensations.get(step)
            if compensation:
                await compensation(state[step])
    
    async def _undo_create_meeting(self, meeting_data: dict):
        # 取消创建的会议室
        await meeting_api.cancel(meeting_data["meeting_id"])
    
    async def _undo_send_invite(self, invite_data: dict):
        # 撤回已发送的邀请
        await notification_api.revoke(invite_data["invite_id"])
```
### 幂等性设计
如果同一个工作流因为网络超时等原因被执行了两次，会产生什么后果？
幂等性是指同一操作执行多次的结果与执行一次相同。在工具编排中，幂等性设计至关重要。
```python
class IdempotencyManager:
    def__init__(self):
        self.execution_records = {}
    
    async def execute_with_idempotency(
        self, 
        step: WorkflowStep, 
        idempotency_key: str
    ) -> StepResult:
        # 检查是否已经执行过
        if idempotency_key inself.execution_records:
            cached_result = self.execution_records[idempotency_key]
            # 返回缓存结果而不是重新执行
            return cached_result
        
        # 首次执行
        result = await step.tool.execute(step.inputs)
        
        # 只有成功才缓存
        if result.is_success:
            self.execution_records[idempotency_key] = result
        
        return result
```
| 级别   | 描述           | 示例                         |
| ---- | ------------ | -------------------------- |
| 天然幂等 | 同一操作多次执行结果相同 | 查询类操作（GET）、删除操作（DELETE）    |
| 条件幂等 | 满足特定条件时幂等    | 创建操作（CREATE IF NOT EXISTS） |
| 非幂等  | 每次执行结果不同     | 计数器递增、发送通知                 |

:::info
"幂等性是生产环境必须考虑的问题。我的设计原则是：查询类操作天然幂等，不需要额外处理创建类操作使用业务幂等键（如 meeting_room_time）防止重复创建发送类操作先查询是否已发送，避免重复通知工作流层面记录执行状态，支持从断点恢复"
:::
## 编排逻辑应该放在哪里？
:::info
"我推荐将编排逻辑放在独立的工作流引擎中，因为多工具协作需要确定性执行、清晰的状态管理和完善的失败处理。但如果场景简单，也可以先用 Prompt 快速验证，后期再迁移到工作流引擎。"
:::
##  展示分层设计思维
:::info
"我认为工具编排需要分层：数据层负责格式转换，状态层负责数据传递，工作流层负责流程控制，LLM 层负责理解用户意图——各层职责清晰，便于维护和扩展。"
:::
##  展示状态管理考虑
:::info
"工具间的数据传递，我会用独立的状态存储而不是依赖上下文。这样做的好处是：状态可追溯（每个工具的输入输出都清晰可见）、可重试（失败后可以从任意步骤恢复）、可调试（出问题能快速定位）。"
:::
## 展示补偿机制设计
:::info
"关于失败回滚，我认为需要分级处理：查询类操作失败不需要回滚；创建类操作失败需要补偿（比如取消已创建的会议室）；发送类操作失败需要先补偿创建再返回失败。回滚的边界是：只补偿本次会话内的操作，不涉及外部系统。"
:::
## 展示实际项目经验
:::info
"上线后我们发现，用纯 Prompt 编排时，约 30% 的多工具任务会出现步骤跳过或顺序错误。迁移到工作流引擎后，成功率提升到 95%，同时通过状态追踪将平均调试时间从 30 分钟降到 2 分钟。"
:::
