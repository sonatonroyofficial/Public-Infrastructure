import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                fontSize: '8rem',
                fontWeight: '900',
                background: 'var(--premium-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
                lineHeight: 1
            }}>
                404
            </div>
            <h1 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>Page Not Found</h1>
            <p style={{
                fontSize: '1.25rem',
                color: 'var(--gray-600)',
                maxWidth: '500px',
                marginBottom: '2rem'
            }}>
                Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/" className="btn btn-primary btn-lg">
                    <FaHome /> Go Home
                </Link>
                <Link to="/contact" className="btn btn-outline btn-lg">
                    <FaExclamationTriangle /> Report Problem
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
