'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-center px-5">
          <h2 className="font-heading text-2xl font-bold text-[#1C1612] mb-3">Something went wrong</h2>
          <p className="text-[#6B6155] mb-6">Please refresh the page or contact hello@codeoutfitters.com</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Refresh Page</button>
        </div>
      </div>
    )
    return this.props.children
  }
}
