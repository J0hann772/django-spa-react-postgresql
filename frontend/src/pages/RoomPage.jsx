import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthContext from '../context/AuthContext';

const RoomPage = () => {
    const { slug } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [guestName, setGuestName] = useState("");

    const fetchRoom = async () => {
        try {
            const res = await api.get(`/api/rooms/${slug}/`);
            setRoom(res.data);
        } catch (error) {
            console.error(error);
            alert("Комната не найдена!");
        }
    };

    useEffect(() => {
        fetchRoom();
        const interval = setInterval(fetchRoom, 5000); // Авто-обновление каждые 5 сек
        return () => clearInterval(interval);
    }, [slug]);

    // --- ЛОГИКА УПРАВЛЕНИЯ (ДЛЯ ХОСТА) ---
    const toggleStatus = async (questionId, field, currentVal) => {
        try {
            await api.patch(`/api/questions/${questionId}/`, { [field]: !currentVal });
            fetchRoom();
        } catch (e) { alert("Ошибка доступа или сети"); }
    };

    const handleBan = async (nickname) => {
        if (!window.confirm(`Забанить пользователя ${nickname}?`)) return;
        try {
            await api.post(`/api/rooms/${slug}/ban_user/`, { nickname });
            alert("Пользователь забанен");
            fetchRoom();
        } catch (e) { alert("Ошибка при бане"); }
    };

    // --- ГОЛОСОВАНИЕ ---
    const handleVote = async (choiceId) => {
        // Проверка для Гостя
        if (!user) {
            if (!guestName.trim()) { alert("Представьтесь!"); return; }
            try {
                await api.post('/api/votes/', { choice: choiceId, guest_nickname: guestName });
                fetchRoom();
            } catch (e) { alert(e.response?.data?.detail || "Ошибка"); }
            return;
        }

        // ПРОВЕРКА НИКА ПРЯМО ПЕРЕД ГОЛОСОМ (Фикс твоего бага)
        try {
            const res = await api.get('/api/auth/users/me/');
            if (!res.data.display_name) {
                if (window.confirm("Нужно заполнить ник. Перейти в профиль?")) navigate('/profile');
                return;
            }
            await api.post('/api/votes/', { choice: choiceId });
            fetchRoom();
        } catch (e) { alert(e.response?.data?.detail || "Ошибка"); }
    };

    if (!room) return <div style={{padding: 20}}>Загрузка...</div>;

    const isCreator = user && (user.display_name === room.creator || user.email === room.creator);

    // Собираем список всех проголосовавших для сайдбара
    const voters = [];
    room.questions.forEach(q => q.choices.forEach(c => { if (c.voters) voters.push(...c.voters) }));
    const uniqueVoters = [...new Set(voters)];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>

            {/* ЛЕВАЯ ЧАСТЬ: ВОПРОСЫ */}
            <div style={{ flex: '2 1 500px' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>← К списку</Link>
                <h1>{room.title}</h1>
                <p style={{ color: '#666' }}>{room.description}</p>

                {!user && (
                    <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <strong>👋 Гость:</strong> <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Твое имя..." style={{ padding: '5px' }} />
                    </div>
                )}

                {room.questions.map(q => (
                    <div key={q.id} style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: q.is_active ? '1px solid #eee' : '2px solid #e74c3c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>{q.is_active ? '❓' : '⛔'} {q.text}</h3>

                            {/* Кнопки хоста */}
                            {isCreator && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => toggleStatus(q.id, 'is_active', q.is_active)} style={{ fontSize: '11px', padding: '5px', cursor: 'pointer', background: q.is_active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                                        {q.is_active ? 'СТОП' : 'ПУСК'}
                                    </button>
                                    <button onClick={() => toggleStatus(q.id, 'show_results', q.show_results)} style={{ fontSize: '11px', padding: '5px', cursor: 'pointer', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}>
                                        {q.show_results ? 'СКРЫТЬ ИТОГИ' : 'ПОДВЕСТИ ИТОГИ'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {q.choices.map(c => (
                            <div key={c.id} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{c.text}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {q.show_results ? (
                                            <span style={{ fontWeight: 'bold' }}>{c.votes_count}</span>
                                        ) : (
                                            <span style={{ color: '#ccc' }}>??</span>
                                        )}
                                        <button onClick={() => handleVote(c.id)} disabled={!q.is_active} style={{ cursor: q.is_active ? 'pointer' : 'not-allowed', padding: '5px 10px', background: q.is_active ? '#3498db' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>
                                            Выбрать
                                        </button>
                                    </div>
                                </div>

                                {/* Список имен под вариантом */}
                                {q.show_results && c.voters && c.voters.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                        {c.voters.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ПАНЕЛЬ ХОСТА / СПИСОК УЧАСТНИКОВ */}
            <div style={{ flex: '1 1 250px', background: '#fcfcfc', padding: '20px', borderRadius: '12px', border: '1px solid #eee', minHeight: '200px' }}>
                <h4 style={{ marginTop: 0 }}>👥 Участники ({uniqueVoters.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {uniqueVoters.map(v => (
                        <div key={v} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '5px', borderBottom: '1px solid #f0f0f0' }}>
                            <span>{v}</span>
                            {isCreator && (
                                <button onClick={() => handleBan(v)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px' }}>Выгнать</button>
                            )}
                        </div>
                    ))}
                </div>
                {uniqueVoters.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>Пока никто не голосовал...</p>}
            </div>
        </div>
    );
};

export default RoomPage;