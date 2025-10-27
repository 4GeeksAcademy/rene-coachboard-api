import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Optionally log errorInfo
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500">An error occurred in AnnouncementsManager.<br />{this.state.error?.message || String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
