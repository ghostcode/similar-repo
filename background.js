// 获取推荐相似仓库：基于当前仓库的主 topic 搜索同类型热门仓库
const GITHUB_API = 'https://api.github.com'
const PER_PAGE = 5

async function getRecommendations(repoFullName) {
  if (!repoFullName || !repoFullName.includes('/')) return []

  // 1. 获取当前仓库信息（含 topics，需 mercy-preview 头）
  const repoRes = await fetch(
    `${GITHUB_API}/repos/${repoFullName}`,
    {
      headers: {
        Accept: 'application/vnd.github.mercy-preview+json, application/vnd.github.v3+json'
      }
    }
  )
  if (!repoRes.ok) return []
  const repoData = await repoRes.json()
  const topics = repoData.topics || []
  const mainTopic = topics[0]

  // 策略改进：
  // 1. 若有 topics，取第一个 topic 搜索
  // 2. 若无 topics，退化为按仓库名搜索（类似 GitHub 搜索 echarts-stat 的效果）
  const query = mainTopic ? `topic:${mainTopic}` : repoData.name
  if (!query) return []

  // 2. 搜索同类型热门仓库，排除当前仓库
  const q = encodeURIComponent(query)
  const searchRes = await fetch(
    `${GITHUB_API}/search/repositories?q=${q}&sort=stars&order=desc&per_page=${PER_PAGE + 2}`,
    {
      headers: { Accept: 'application/vnd.github.v3+json' }
    }
  )
  if (!searchRes.ok) return []
  const data = await searchRes.json()
  const currentLower = repoFullName.toLowerCase()
  const items = (data.items || [])
    .filter(item => (item.full_name || '').toLowerCase() !== currentLower)
    .slice(0, PER_PAGE)
  console.log('😀 >>> items', items)
  return items
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_RECOMMENDATIONS' && message.repoFullName) {
    getRecommendations(message.repoFullName)
      .then(sendResponse)
      .catch(() => sendResponse([]))
    return true
  }
})
