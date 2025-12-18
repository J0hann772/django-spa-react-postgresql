import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import { useContext, useEffect, useState } from 'react';
import AuthContext from './context/AuthContext';
import api from './api/client';
import styles from './App.module.css';

// Вспомогательный компонент Layout
const MainLayout = () => {
    let { user, logoutUser } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [realUser, setRealUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRooms();
        if (user) {
            api.get('/api/auth/users/me/').then(res => setRealUser(res.data));
        }
    }, [user]);

    const fetchRooms = () => api.get('/api/rooms/').then(r => setRooms(r.data));

    const deleteRoom = async (e, slug) => {
        e.preventDefault(); e.stopPropagation();
        if (!window.confirm("Удалить комнату?")) return;
        await api.delete(`/api/rooms/${slug}/`); fetchRooms();
    };

    const createRoom = async (e) => {
        e.preventDefault();
        if(!newTitle.trim()) return;
        setLoading(true);
        try {
            await api.post('/api/rooms/', { title: newTitle, slug: newTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() });
            setNewTitle(""); fetchRooms();
        } finally { setLoading(false); }
    };

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link to="/"><h1 className={styles.navTitle}>Voting App</h1></Link>
                <div>
                    {user ? (
                        <div className={styles.authBlock}>
                            {realUser && (
                                <span className={styles.userName}>
                                    Привет, <strong>{realUser.display_name || realUser.email}</strong>
                                </span>
                            )}
                            <button onClick={logoutUser} className="global-btn btn-danger" style={{padding: '8px 15px'}}>
                                Выйти
                            </button>
                        </div>
                    ) : (
                        <div className={styles.guestBlock}>
                            <Link to="/login"><button className="global-btn btn-ghost">Войти</button></Link>
                            <Link to="/register"><button className="global-btn btn-primary">Регистрация</button></Link>
                        </div>
                    )}
                </div>
            </nav>

            {user && (
                <div className={styles.createRoomCard}>
                    <h3 className={styles.cardHeader}>🚀 Создать новую комнату</h3>
                    <form onSubmit={createRoom} className={styles.createFormRow}>
                        <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="Название комнаты..."
                            required
                            className="global-input"
                        />
                        <button type="submit" disabled={loading} className="global-btn btn-primary">
                            {loading ? '...' : 'Создать'}
                        </button>
                    </form>
                </div>
            )}

            <h4 className={styles.sectionHeader}>Активные комнаты</h4>
            <div className={styles.roomsList}>
                {rooms.length === 0 && <p className="text-muted">Комнат пока нет.</p>}
                {rooms.map(room => (
                    <Link key={room.id} to={`/room/${room.slug}`}>
                        <div className={styles.roomItem}>
                            <div>
                                <span className={styles.roomTitle}>{room.title}</span>
                                <span className={styles.roomMeta}>Автор: {room.creator}</span>
                            </div>
                            {realUser && (realUser.display_name === room.creator || realUser.email === room.creator) && (
                                <button
                                    onClick={(e) => deleteRoom(e, room.slug)}
                                    className="global-btn btn-danger"
                                    style={{padding: '6px 12px', fontSize: '0.8em'}}
                                >
                                    Удалить
                                </button>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<MainLayout />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/room/:slug" element={<RoomPage />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}
export default App;