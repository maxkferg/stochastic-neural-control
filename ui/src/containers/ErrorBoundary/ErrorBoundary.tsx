import React from 'react'
import { ToastContainer, toast } from 'react-toastify';

interface State {
    hasError: boolean
}

class ErrorBoundary extends React.Component<{}, State> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        toast(error, errorInfo);
    }
    render() {
        const { hasError } = this.state;
        if (hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return (<React.Fragment>
            <ToastContainer />
            {this.props.children}
            </React.Fragment>
        )
    }
}

export default ErrorBoundary