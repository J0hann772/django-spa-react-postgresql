import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthContext from '../context/AuthContext';

const RoomPage = () => {
    const { slug } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // State для гостя
    const [guestName, setGuestName] = useState("");
    const [isNameSaved, setIsNameSaved] = useState(false);

    // State для создания вопроса
    const [newQuestionText, setNewQuestionText] = useState("");
    const [newChoices, setNewChoices] = useState(["", ""]);

    // 1. При загрузке ищем сохраненное имя гостя
    useEffect(() => {
        const saved = localStorage.getItem(`guest_name_${slug}`);
        if (saved) {
            setGuestName(saved);
            setIsNameSaved(true);
        }
    }, [slug]);

    const fetchRoom = async () => {
        try {
            // Отправляем имя гостя для проверки на бан
            const nameCheck = localStorage.getItem(`guest_name_${slug}`) || guestName;
            const params = {};
            if (nameCheck && !user) {
                params.guest_name = nameCheck;
            }

            const res = await api.get(`/api/rooms/${slug}/`, { params });
            setRoom(res.data);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert("⛔ ВЫ ЗАБАНЕНЫ. Доступ к комнате закрыт.");
                navigate('/');
            } else if (error.response && error.response.status === 404) {
                alert("Комната не найдена");
                navigate('/');
            } else {
                console.error("Ошибка сети", error);
            }
        }
    };

    useEffect(() => {
        fetchRoom();
        if (user) {
            api.get('/api/auth/users/me/').then(res => setCurrentUser(res.data)).catch(console.error);
        }
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [slug, user]);

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
        if (!window.confirm(`Забанить пользователя ${nickname}?`)) return;
        try {
            await api.post(`/api/rooms/${slug}/ban_user/`, { nickname });
            fetchRoom();
            alert(`Пользователь ${nickname} забанен.`);
        } catch (e) { alert("Ошибка бана"); }
    };

    const handleVote = async (choiceId) => {
        if (!user) {
            if (!guestName.trim()) { alert("Представьтесь!"); return; }
            try {
                await api.post('/api/votes/', { choice: choiceId, guest_nickname: guestName });

                // Запоминаем имя после успешного голоса
                localStorage.setItem(`guest_name_${slug}`, guestName);
                setIsNameSaved(true);

                alert("Голос принят! ✅");
                fetchRoom();
            } catch (e) { handleError(e); }
            return;
        }

        const u = currentUser || user;
        if (!u.display_name) {
            if (window.confirm("Нужен ник. В профиль?")) navigate('/profile');
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
        else alert("Ошибка");
    };

    // --- Функции создания вопроса ---
    const addChoiceInput = () => setNewChoices([...newChoices, ""]);
    const updateChoiceInput = (index, value) => {
        const updated = [...newChoices];
        updated[index] = value;
        setNewChoices(updated);
    };
    const removeChoiceInput = (index) => setNewChoices(newChoices.filter((_, i) => i !== index));

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestionText.trim()) return alert("Введите текст");
        const validChoices = newChoices.filter(c => c.trim() !== "");
        if (validChoices.length < 2) return alert("Нужно 2 варианта");

        try {
            const qRes = await api.post('/api/questions/', {
                room: room.id,
                text: newQuestionText,
                is_active: true, show_results: false
            });
            await Promise.all(validChoices.map(text =>
                api.post('/api/choices/', { question: qRes.data.id, text })
            ));
            setNewQuestionText(""); setNewChoices(["", ""]);
            alert("Вопрос создан! 🎉"); fetchRoom();
        } catch (err) { alert("Ошибка создания"); }
    };

    if (!room) return <div style={{padding: 20}}>Загрузка...</div>;

    const allVotes = [];
    room.questions.forEach(q => {
        q.choices.forEach(c => {
            if (c.voters && c.voters.length > 0) allVotes.push(...c.voters);
        });
    });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 500px' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>← К списку</Link>
                <h1>{room.title}</h1>
                <p style={{ color: '#666' }}>{room.description}</p>
                {isCreator && <div style={{background:'#2ecc71', color:'white', padding:'5px', borderRadius:'4px', marginBottom:'10px', display:'inline-block'}}>👑 Вы - Создатель</div>}

                {/* БЛОК ГОСТЯ (Строгий режим: без кнопки смены) */}
                {!user && (
                    <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <strong>👋 Гость:</strong>
                        {isNameSaved ? (
                            <span style={{fontWeight: 'bold', marginLeft: '10px', color: '#856404'}}>
                                {guestName} (Вы)
                            </span>
                        ) : (
                            <input
                                type="text"
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                placeholder="Ваше имя..."
                                style={{ padding: '5px', marginLeft: '10px' }}
                            />
                        )}
                    </div>
                )}

                {/* ФОРМА СОЗДАНИЯ ВОПРОСА */}
                {isCreator && (
                    <div style={{ background: '#ecf0f1', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #bdc3c7' }}>
                        <h3 style={{marginTop: 0}}>➕ Новый вопрос</h3>
                        <input type="text" placeholder="Вопрос..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                        <div style={{marginBottom: '10px'}}>
                            {newChoices.map((choice, idx) => (
                                <div key={idx} style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                                    <input type="text" placeholder={`Вариант ${idx + 1}`} value={choice} onChange={e => updateChoiceInput(idx, e.target.value)} style={{flex: 1, padding: '8px'}} />
                                    {newChoices.length > 2 && <button onClick={() => removeChoiceInput(idx)} style={{background: '#e74c3c', color:'white', border:'none'}}>✕</button>}
                                </div>
                            ))}
                            <button onClick={addChoiceInput} style={{background: '#3498db', color: 'white', border: 'none', padding: '5px'}}>+ Вариант</button>
                        </div>
                        <button onClick={handleCreateQuestion} style={{width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none'}}>Создать</button>
                    </div>
                )}

                {/* СПИСОК ВОПРОСОВ */}
                {room.questions.map(q => (
                    <div key={q.id} style={{ marginBottom: '30px', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: q.is_active ? '1px solid #eee' : '2px solid #e74c3c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>{q.is_active ? '❓' : '⛔'} {q.text}</h3>
                            {isCreator && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => toggleStatus(q.id, 'is_active', q.is_active)} style={{ fontSize: '12px', padding: '5px', background: q.is_active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none' }}>
                                        {q.is_active ? 'СТОП' : 'ПУСК'}
                                    </button>
                                    <button onClick={() => toggleStatus(q.id, 'show_results', q.show_results)} style={{ fontSize: '12px', padding: '5px', background: '#3498db', color: 'white', border: 'none' }}>
                                        {q.show_results ? 'СКРЫТЬ' : 'ИТОГИ'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {q.choices.map(c => (
                            <div key={c.id} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{c.text}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {(isCreator || q.show_results) ? <strong>{c.votes_count}</strong> : <span style={{color:'#ccc'}}>??</span>}
                                        <button onClick={() => handleVote(c.id)} disabled={!q.is_active} style={{ cursor: q.is_active ? 'pointer' : 'not-allowed', padding: '5px 10px', background: q.is_active ? '#3498db' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>Выбрать</button>
                                    </div>
                                </div>
                                {c.voters && c.voters.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#555', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                        <strong>Голоса:</strong> {c.voters.map(v => v.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* ЛЕНТА УЧАСТНИКОВ */}
            <div style={{ flex: '1 1 250px', background: '#fcfcfc', padding: '20px', borderRadius: '12px', border: '1px solid #eee', maxHeight:'80vh', overflowY:'auto' }}>
                <h4>📊 Лента ({allVotes.length})</h4>
                {allVotes.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px', background: 'white', border: '1px solid #eee', borderRadius: '8px', marginBottom:'5px' }}>
                        <div>
                            <div style={{fontWeight:'bold'}}>{v.name}</div>
                            <div style={{fontSize:'11px', color:'#7f8c8d'}}>{v.choice}</div>
                        </div>
                        {isCreator && (
                            <button onClick={() => handleBan(v.name)} style={{ color: '#e74c3c', border: '1px solid #e74c3c', borderRadius:'4px', background: 'none', cursor: 'pointer', padding:'2px', fontSize:'10px' }}>BAN</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomPage;