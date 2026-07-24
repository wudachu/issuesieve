# IssueSieve

面向开源维护者、强调人工复核的 Issue/PR 分诊与发布说明工具。

[English README](README.md)

IssueSieve 会把 GitHub Issue 或 Pull Request 元数据整理成严格的结构化建议，包括类型、优先级、置信度、建议标签、缺失信息、维护者下一步动作和回复草稿；也可以根据已合并 PR 生成保留贡献者署名的 release notes。

它不会把 AI 判断当作最终决定：

- 仓库里的文本一律按“不可信数据”处理，不能覆盖系统规则；
- 疑似安全问题会转交人工和私密渠道处理；
- CLI 只输出建议，不修改标签、不发布评论；
- GitHub Action 只维护一条带标记的评论，避免重复刷屏；
- 输出会明确注明需要维护者审核。

## 无需 API Key 的演示

```bash
npm install
npm run demo
npm run demo -- --format json
npx tsx src/cli.ts release --file examples/sample-release.json --mock
```

离线 mock 模式是确定性的，可验证数据解析、输出格式和安全分流，不会产生网络请求或费用。

## 使用 OpenAI API

```bash
export OPENAI_API_KEY="你的-api-key"
npx tsx src/cli.ts triage --file examples/sample-issue.json
npx tsx src/cli.ts triage --url https://github.com/OWNER/REPO/issues/123
npx tsx src/cli.ts release --file examples/sample-release.json
```

项目使用 OpenAI Responses API 和 Structured Outputs，默认模型为 `gpt-5.6-sol`。你可以通过 `OPENAI_MODEL` 改成组织账号可用的其他模型。

读取公开 GitHub URL 时可以不配置 `GITHUB_TOKEN`，但配置后能减少匿名 API 限流。Token 只用于访问 GitHub，不会发送给模型。

## GitHub Action

仓库包含一个可复用的 composite action。提交构建生成的 `dist/`，在仓库中创建 `OPENAI_API_KEY` Actions Secret，然后参考 [英文 README](README.md#github-action) 配置工作流。

仓库自带的 [IssueSieve 工作流](.github/workflows/issuesieve.yml) 默认关闭；将仓库变量 `ISSUESIEVE_ENABLED` 设为 `true` 后才会执行，避免刚公开仓库时因尚未配置密钥而失败。

## 开发与验证

需要 Node.js 20 或更新版本。

```bash
npm install
npm run check
```

CI 不会调用付费 API。贡献者无需 OpenAI API Key，也能运行完整的类型检查、单元测试和构建。

## 申请开源支持前

只有一个刚创建的公开仓库通常不足以证明项目价值。建议先完成真实发布、持续提交、收集维护者反馈，并公开记录 Issue、PR、release 和路线图。具体步骤见 [公开发布清单](docs/LAUNCH_CHECKLIST.md) 和 [申请材料草稿](docs/OPENAI_APPLICATION.zh-CN.md)。

## 许可证

[MIT](LICENSE)
