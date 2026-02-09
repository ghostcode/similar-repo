# GitHub 相似仓库推荐

Chrome 扩展：在 GitHub 仓库页根据当前仓库的 topics 和语言推荐相似仓库，以卡片形式展示在右侧栏 **About** 模块之上。

## 功能

- 仅在 **仓库根页**（`github.com/owner/repo`）注入，不干扰 issues、PR、文件等页面
- 使用 GitHub API 获取当前仓库的 topics 与语言，再按 `topic` + `language` 搜索相似仓库
- 推荐结果以卡片形式展示在 About 之上，每张卡片包含：仓库名、简介、语言、Star 数，点击跳转


## 说明

- 使用公开 GitHub API，未登录时每分钟请求有限；若需更高限额可自行配置 [Personal Access Token](https://github.com/settings/tokens)（需在扩展中增加可选配置）
- 若当前仓库未设置 topics，会退化为按主语言搜索，推荐数量可能较少

## 文件结构

```
similar-repo/
├── manifest.json      # 扩展配置
├── content-script.js   # 注入逻辑与 API 调用
├── styles.css         # 卡片样式
├── icons/             # 扩展图标
└── README.md
```
