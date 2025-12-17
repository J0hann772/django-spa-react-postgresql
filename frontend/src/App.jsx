import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import { useContext, useEffect, useState } from 'react';
import AuthContext from './context/AuthContext';
import api from './api/client';

// Компонент-обертка для перехвата 401 ошибки
const MainLayout = () => {
    let { user, logoutUser } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [realUser, setRealUser] = useState(null);

    // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ БАГА АВТОРИЗАЦИИ ---
    useEffect(() => {
        // Создаем перехватчик ответов
        const interceptor = api.interceptors.response.use(
            response => response,
            error => {
                // Если сервер сказал "401 Unauthorized" (токен умер или юзер вышел)
                if (error.response && error.response.status === 401) {
                    console.warn("Сессия истекла, выходим...");
                    logoutUser(); // Принудительно разлогиниваем на фронте
                }
                return Promise.reject(error);
            }
        );

        // Удаляем перехватчик при размонтировании, чтобы не дублировались
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [logoutUser]);
    // ---------------------------------------------

    const fetchRooms = () => api.get('/api/rooms/').then(r => setRooms(r.data)).catch(e => console.log(e));

    useEffect(() => {
        fetchRooms();
        if (user) {
            api.get('/api/auth/users/me/')
               .then(res => setRealUser(res.data))
               .catch(console.error);
        }
    }, [user]);

    const deleteRoom = async (slug) => {
        if (!window.confirm("Удалить комнату?")) return;
        try {
            await api.delete(`/api/rooms/${slug}/`);
            fetchRooms();
        } catch { alert("Ошибка удаления"); }
    };

    const createRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/rooms/', { title: newTitle, slug: newTitle.toLowerCase() + '-' + Date.now() });
            setNewTitle(""); fetchRooms();
        } catch (err) { alert("Ошибка: " + err.response?.data?.detail); }
    };

    const btnStyle = { padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: 'white' };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h1 style={{ margin: 0 }}>Voting SPA</h1>
                <div>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {realUser && realUser.display_name ? (
                                <span style={{ fontWeight: 'bold', color: '#2980b9', fontSize: '1.1em' }}>
                                    {realUser.display_name}
                                </span>
                            ) : (
                                <Link to="/profile">
                                    <button style={{ ...btnStyle, background: '#f39c12' }}>Заполнить nickname</button>
                                </Link>
                            )}
                            <button onClick={logoutUser} style={{ ...btnStyle, background: '#e74c3c' }}>Выйти</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/register"><button style={{ ...btnStyle, background: '#27ae60' }}>Регистрация</button></Link>
                            <Link to="/login"><button style={{ ...btnStyle, background: '#2980b9' }}>Войти</button></Link>
                        </div>
                    )}
                </div>
            </nav>

            {user && (
                <form onSubmit={createRoom} style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', color: 'white', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0 }}>🚀 Создать комнату</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Название..." required style={{ flex: 1, padding: '10px', borderRadius: '5px' }} />
                        <button type="submit" style={{ ...btnStyle, background: '#27ae60' }}>Создать</button>
                    </div>
                </form>
            )}

            <h3>Активные комнаты:</h3>
            {rooms.map(room => (
                <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }}>
                    <Link to={`/room/${room.slug}`} style={{ textDecoration: 'none', color: '#2980b9', flex: 1 }}>
                        <strong>{room.title}</strong>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>Создатель: {room.creator}</div>
                    </Link>
                    {realUser && realUser.display_name === room.creator && (
                        <button onClick={() => deleteRoom(room.slug)} style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', padding: '5px', cursor: 'pointer', borderRadius: '5px' }}>🗑</button>
                    )}
                </div>
            ))}
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