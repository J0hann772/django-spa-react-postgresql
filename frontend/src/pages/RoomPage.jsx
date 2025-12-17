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

    // Храним свежие данные юзера, чтобы точно знать, создатель он или нет
    const [currentUser, setCurrentUser] = useState(null);

    const fetchRoom = async () => {
        try {
            const res = await api.get(`/api/rooms/${slug}/`);
            setRoom(res.data);
        } catch (error) {
            console.error("Ошибка загрузки комнаты", error);
        }
    };

    // Загружаем комнату и профиль юзера при старте
    useEffect(() => {
        fetchRoom();

        if (user) {
            api.get('/api/auth/users/me/')
               .then(res => setCurrentUser(res.data))
               .catch(err => console.error(err));
        }

        const interval = setInterval(fetchRoom, 2000); // Быстрое обновление (2 сек)
        return () => clearInterval(interval);
    }, [slug, user]);

    // ЛОГИКА ОПРЕДЕЛЕНИЯ СОЗДАТЕЛЯ
    // Используем currentUser (свежий) или user (из токена)
    const checkIsCreator = () => {
        if (!room) return false;
        const u = currentUser || user;
        if (!u) return false;
        return (u.display_name === room.creator) || (u.email === room.creator);
    };
    const isCreator = checkIsCreator();

    const toggleStatus = async (questionId, field, currentVal) => {
        try {
            await api.patch(`/api/questions/${questionId}/`, { [field]: !currentVal });
            fetchRoom();
        } catch (e) { alert("Ошибка доступа"); }
    };

    const handleBan = async (nickname) => {
        if (!window.confirm(`Забанить ${nickname}?`)) return;
        try {
            await api.post(`/api/rooms/${slug}/ban_user/`, { nickname });
            fetchRoom();
            alert("Забанен.");
        } catch (e) { alert("Ошибка бана"); }
    };

    const handleVote = async (choiceId) => {
        if (!user) {
            if (!guestName.trim()) { alert("Представьтесь!"); return; }
            try {
                await api.post('/api/votes/', { choice: choiceId, guest_nickname: guestName });
                alert("Голос принят! ✅");
                fetchRoom();
            } catch (e) { handleError(e); }
            return;
        }

        // Если юзер, проверяем имя
        const u = currentUser || user;
        if (!u.display_name) {
            if (window.confirm("Заполните имя в профиле. Перейти?")) navigate('/profile');
            return;
        }

        try {
            await api.post('/api/votes/', { choice: choiceId });
            alert("Голос принят! ✅");
            fetchRoom();
        } catch (e) { handleError(e); }
    };

    const handleError = (error) => {
        if (error.response?.data?.non_field_errors) alert(error.response.data.non_field_errors[0]);
        else if (error.response?.data?.detail) alert(error.response.data.detail);
        else alert("Ошибка при голосовании");
    };

    if (!room) return <div style={{padding: 20}}>Загрузка...</div>;

    // Собираем список голосов
    const allVotes = [];
    room.questions.forEach(q => {
        q.choices.forEach(c => {
            if (c.voters && c.voters.length > 0) allVotes.push(...c.voters);
        });
    });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>

            {/* ЛЕВАЯ ЧАСТЬ: ВОПРОСЫ */}
            <div style={{ flex: '2 1 500px' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>← К списку</Link>
                <h1>{room.title}</h1>
                <p style={{ color: '#666' }}>{room.description}</p>
                {isCreator && <div style={{background:'#2ecc71', color:'white', padding:'5px', borderRadius:'4px', marginBottom:'10px', display:'inline-block'}}>👑 Вы - Создатель (Видите всё)</div>}

                {!user && (
                    <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <strong>👋 Гость:</strong> <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Ваше имя..." style={{ padding: '5px', marginLeft: '10px' }} />
                    </div>
                )}

                {room.questions.map(q => (
                    <div key={q.id} style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: q.is_active ? '1px solid #eee' : '2px solid #e74c3c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>{q.is_active ? '❓' : '⛔'} {q.text}</h3>

                            {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
                            {isCreator && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => toggleStatus(q.id, 'is_active', q.is_active)} style={{ fontSize: '12px', padding: '8px 12px', cursor: 'pointer', background: q.is_active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                                        {q.is_active ? '⏹ ОСТАНОВИТЬ' : '▶ ЗАПУСТИТЬ'}
                                    </button>
                                    <button onClick={() => toggleStatus(q.id, 'show_results', q.show_results)} style={{ fontSize: '12px', padding: '8px 12px', cursor: 'pointer', background: q.show_results ? '#7f8c8d' : '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}>
                                        {q.show_results ? '👁 СКРЫТЬ ИТОГИ' : '🏁 ПОКАЗАТЬ ИТОГИ'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {q.choices.map(c => (
                            <div key={c.id} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{c.text}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {/* Если создатель или итоги открыты -> показываем цифры */}
                                        {(isCreator || q.show_results) ? (
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
                                {c.voters && c.voters.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#555', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                        <strong>Голосовали:</strong> {c.voters.map(v => v.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ЛЕНТА ГОЛОСОВ (REAL-TIME) */}
            <div style={{ flex: '1 1 250px', background: '#fcfcfc', padding: '20px', borderRadius: '12px', border: '1px solid #eee', alignSelf: 'flex-start', maxHeight:'80vh', overflowY:'auto' }}>
                <h4 style={{ marginTop: 0 }}>📊 Лента голосов ({allVotes.length})</h4>

                {allVotes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#999' }}>Список пуст (или скрыт)...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {allVotes.map((v, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{fontWeight:'bold', color: '#2c3e50'}}>{v.name}</div>
                                    <div style={{fontSize:'11px', color:'#7f8c8d'}}>
                                        Выбрал: <span style={{color: '#2980b9', fontWeight:'bold'}}>{v.choice}</span>
                                    </div>
                                </div>
                                {isCreator && (
                                    <button onClick={() => handleBan(v.name)} title="Выгнать" style={{ color: '#e74c3c', border: '1px solid #e74c3c', borderRadius:'4px', background: 'none', cursor: 'pointer', padding:'2px 6px', fontSize:'10px' }}>
                                        BAN
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomPage;