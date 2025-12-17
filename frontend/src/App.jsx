import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import { useContext, useEffect, useState } from 'react';
import AuthContext from './context/AuthContext';
import api from './api/client';

const HomePage = () => {
    let { user, logoutUser } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newTitle, setNewTitle] = useState("");

    const fetchRooms = () => api.get('/api/rooms/').then(r => setRooms(r.data));
    useEffect(() => { fetchRooms(); }, []);

    const deleteRoom = async (slug) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту комнату?")) return;
        try {
            await api.delete(`/api/rooms/${slug}/`);
            fetchRooms();
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert("Ошибка: Вы можете удалять только свои комнаты!");
            } else {
                alert("Ошибка при удалении.");
            }
        }
    };

    const createRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/rooms/', { title: newTitle, slug: newTitle.toLowerCase() + '-' + Date.now() });
            setNewTitle(""); fetchRooms();
            alert("Комната создана!");
        } catch (e) { alert("Ошибка: " + e.response?.data?.detail); }
    };

    // Стили для кнопок
    const btnStyle = { padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: 'white' };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
            {/* --- ШАПКА САЙТА (NAV) --- */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h1 style={{ margin: 0, color: '#2c3e50' }}>Voting SPA</h1>

                <div>
                    {user ? (
                        // Если пользователь авторизован
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* 1. Приветствие и Имя (отдельным текстом) */}
                            <span style={{ color: '#7f8c8d', marginRight: '5px' }}>
                                Привет, <strong style={{ color: '#2980b9' }}>{user.display_name || user.email}</strong>!
                            </span>

                            {/* 2. Ссылка на Профиль (Кнопка с шестеренкой) */}
                            <Link to="/profile" title="Настройки профиля">
                                <button style={{ ...btnStyle, background: '#f39c12', padding: '8px 12px' }}>
                                    ⚙
                                </button>
                            </Link>

                            {/* 3. Кнопка Выйти */}
                            <button onClick={logoutUser} style={{ ...btnStyle, background: '#e74c3c' }}>
                                Выйти
                            </button>
                        </div>
                    ) : (
                        // Если гость
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/register"><button style={{ ...btnStyle, background: '#27ae60' }}>Регистрация</button></Link>
                            <Link to="/login"><button style={{ ...btnStyle, background: '#2980b9' }}>Войти</button></Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Форма создания комнаты */}
            {user && (
                <form onSubmit={createRoom} style={{ background: '#34495e', padding: '20px', borderRadius: '10px', color: 'white', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0 }}>🚀 Создать новую комнату</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Название комнаты..." required style={{ flex: 1, padding: '12px', borderRadius: '5px', border: 'none', outline: 'none' }} />
                        <button type="submit" style={{ ...btnStyle, background: '#27ae60', padding: '12px 25px' }}>Создать</button>
                    </div>
                </form>
            )}

            {/* Список комнат */}
            <h3>Активные комнаты:</h3>
            {rooms.length === 0 ? <p style={{color: '#999'}}>Комнат пока нет...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rooms.map(room => (
                        <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <Link to={`/room/${room.slug}`} style={{ textDecoration: 'none', color: '#2980b9', flex: 1 }}>
                                <strong style={{ fontSize: '1.1em' }}>{room.title}</strong>
                                <div style={{ fontSize: '0.85em', color: '#95a5a6', marginTop: '5px' }}>Создатель: {room.creator}</div>
                            </Link>

                            {user && user.display_name === room.creator && (
                                <button
                                    onClick={() => deleteRoom(room.slug)}
                                    style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 12px', cursor: 'pointer', borderRadius: '5px', transition: '0.2s' }}
                                    title="Удалить комнату"
                                >
                                    🗑
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
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