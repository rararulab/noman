# Contributing to noman

noman 使用统一流程：**Issue → Workflow → PR**。

## Required Flow

1. **先开 Issue**
   - 描述问题/目标、范围、验收标准。
   - 没有 Issue 的代码改动不接受（紧急 hotfix 除外，且需补 Issue）。

2. **基于 Issue 建分支**
   - 命名建议：`feat/<issue-id>-<short-name>`、`fix/<issue-id>-<short-name>`。
   - 示例：`feat/42-agent-native-entry`

3. **提交 PR**
   - PR 必须在正文包含：`Closes #<issue-id>`。
   - PR 必须填写变更说明与验证证据。

4. **通过 Workflow**
   - PR 必须通过 CI（至少 `npm run build`）。
   - PR policy 检查必须通过。

## Commit Convention (recommended)

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构
- `test:` 测试
- `chore:` 杂项

## Review Expectations

- 改动要保持归一性（同类事情一种做法）。
- 优先删除冗余复杂度，再考虑新增抽象。
- 任何“完成”声明都要带验证命令或证据。
