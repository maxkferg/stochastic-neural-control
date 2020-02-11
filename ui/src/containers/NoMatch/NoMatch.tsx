import * as React from 'react';
import { Link } from 'react-router-dom';
import './NoMatch.css';

export default function NoMatch() {
    return (
        <div id="notfound">
            <div className="notfound">
                <div className="notfound-404">
                    <h1>Oops!</h1>
                    <h2>404 - The Page can't be found</h2>
                </div>
                <Link to="/">Go TO Home Page</Link>
            </div>
        </div>
    )
}
