import React from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FF8C00] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="text-4xl">😵</div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              Something went wrong
            </h1>
            <p className="text-sm text-[#555555]">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2B80FF] text-white hover:opacity-90 transition-opacity"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
