export interface DocsRailScrollMetrics {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}

export interface DocsRailFadeState {
  showTop: boolean
  showBottom: boolean
}

const SCROLL_EPSILON = 1

export const getDocsRailFadeState = ({
  scrollTop,
  clientHeight,
  scrollHeight,
}: DocsRailScrollMetrics): DocsRailFadeState => {
  const maxScrollTop = Math.max(scrollHeight - clientHeight, 0)

  if (maxScrollTop <= SCROLL_EPSILON) {
    return {
      showTop: false,
      showBottom: false,
    }
  }

  return {
    showTop: scrollTop > SCROLL_EPSILON,
    showBottom: maxScrollTop - scrollTop > SCROLL_EPSILON,
  }
}
