import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // In real app you'd log this to remote monitoring
    // console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-slate-600">The section failed to load. Try refreshing the page.</p>
        </div>
      )
    }
    return this.props.children
  }
}
