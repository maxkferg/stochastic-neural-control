import React from 'react'

interface State {
    hasError: boolean
}

interface Props { 

}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.log(error, errorInfo);
    }
    render() {
        console.log('huhu')
        const { hasError } = this.state;
        if (hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return (
            this.props.children
        )
    }
}

export default ErrorBoundary