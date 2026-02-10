; (function () {
  'use strict'

  const REPO_PAGE_PATH_REG = /^\/[^/]+\/[^/]+\/?$/

  function isRepoPage() {
    const path = location.pathname.replace(/\/$/, '')
    const parts = path.split('/').filter(Boolean)
    return parts.length === 2 && REPO_PAGE_PATH_REG.test(path)
  }

  function getRepoFullName() {
    const parts = location.pathname.split('/').filter(Boolean)
    return parts.length === 2 ? `${parts[0]}/${parts[1]}` : ''
  }

  function getRecommendationsFromBackground(repoFullName) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(
        { type: 'GET_RECOMMENDATIONS', repoFullName },
        (items) => resolve(Array.isArray(items) ? items : [])
      )
    })
  }

  function findBorderGridAboutMargin() {
    return document.querySelector('.BorderGrid.about-margin')
  }

  function createCard(item) {
    const fullName = item.full_name || ''
    const url = item.html_url || `https://github.com/${fullName}`
    const desc = (item.description || '').trim().slice(0, 100)
    const stars = item.stargazers_count != null ? item.stargazers_count : 0
    const lang = item.language || ''

    const card = document.createElement('a')
    card.href = url
    card.target = '_blank'
    card.rel = 'noopener noreferrer'
    card.className = 'similar-repo-card'

    card.innerHTML = `
      <span class="similar-repo-card__name">${escapeHtml(fullName)}</span>
      ${desc ? `<span class="similar-repo-card__desc">${escapeHtml(desc)}</span>` : ''}
      <span class="similar-repo-card__meta">
        ${lang ? `<span class="similar-repo-card__lang">${escapeHtml(lang)}</span>` : ''}
        <span class="similar-repo-card__stars">★ ${formatStars(stars)}</span>
      </span>
    `
    return card
  }

  function escapeHtml(s) {
    const div = document.createElement('div')
    div.textContent = s
    return div.innerHTML
  }

  function formatStars(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return String(n)
  }

  function renderPanel(repos) {
    const wrap = document.createElement('div')
    wrap.className = 'similar-repo-panel'
    wrap.setAttribute('data-similar-repo-extension', 'true')

    const title = document.createElement('div')
    title.className = 'similar-repo-panel__title'
    title.textContent = 'Similar repositories'

    const grid = document.createElement('div')
    grid.className = 'similar-repo-panel__grid'
    repos.forEach(item => grid.appendChild(createCard(item)))

    wrap.appendChild(title)
    wrap.appendChild(grid)
    return wrap
  }

  function renderError(message) {
    const wrap = document.createElement('div')
    wrap.className = 'similar-repo-panel similar-repo-panel--error'
    wrap.setAttribute('data-similar-repo-extension', 'true')
    wrap.innerHTML = `<span class="similar-repo-panel__title">Similar repositories</span><p class="similar-repo-panel__msg">${escapeHtml(message)}</p>`
    return wrap
  }

  function renderLoading() {
    const wrap = document.createElement('div')
    wrap.className = 'similar-repo-panel similar-repo-panel--loading'
    wrap.setAttribute('data-similar-repo-extension', 'true')
    wrap.setAttribute('data-similar-repo-loading', 'true')
    wrap.innerHTML = '<span class="similar-repo-panel__title">Similar repositories</span><p class="similar-repo-panel__msg">Loading…</p>'
    return wrap
  }

  function injectPanel() {
    if (document.querySelector('[data-similar-repo-extension]')) return
    const borderGrid = findBorderGridAboutMargin()
    if (!borderGrid) return

    const row = document.createElement('div')
    row.className = 'BorderGrid-row'
    row.setAttribute('data-similar-repo-extension', 'true')

    const loadingEl = renderLoading()
    row.appendChild(loadingEl)
    borderGrid.insertBefore(row, borderGrid.firstElementChild)

    const repoFullName = getRepoFullName()
    getRecommendationsFromBackground(repoFullName)
      .then(repos => {
        console.log('😀 >>> repos', repos)
        loadingEl.remove()
        const panel = repos.length
          ? renderPanel(repos)
          : renderError('No similar repositories found. Add a topic to this repo to get recommendations.')
        row.appendChild(panel)
      })
      .catch(() => {
        loadingEl.remove()
        const panel = renderError('Failed to load similar repositories.')
        row.appendChild(panel)
      })
  }

  function run() {
    if (!isRepoPage()) return
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectPanel())
      return
    }
    const observer = new MutationObserver(() => {
      const borderGrid = findBorderGridAboutMargin()
      if (borderGrid && !document.querySelector('[data-similar-repo-extension]')) {
        injectPanel()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => injectPanel(), 800)
  }

  run()
})()
