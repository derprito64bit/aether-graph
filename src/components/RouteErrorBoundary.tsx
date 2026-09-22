import { Component, type ReactNode } from 'react'

interface Props {
  routeName: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Per-route error boundary with a designed fallback, never a white screen. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section aria-label={`${this.props.routeName} failed to load`}>
          <h1>Something interrupted this section.</h1>
          <p>The content is still available by reloading or visiting another page.</p>
        </section>
      )
    }
    return this.props.children
  }
}
