import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import AuthContext from '../context/AuthContext';
import styles from './RoomPage.module.css';

const RoomPage = () => {
    const { slug } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const [currentUserInfo, setCurrentUserInfo] = useState(null);

    const [guestNick, setGuestNick] = useState(localStorage.getItem('guestNick') || '');
    const [tempGuestNick, setTempGuestNick] = useState(guestNick);

    // Админские состояния
    const [newQ, setNewQ] = useState("");
    const [newC, setNewC] = useState({});
    const [banNick, setBanNick] = useState("");

    const [votedChoices, setVotedChoices] = useState({});

    useEffect(() => {
        fetchRoomData();
        if (user) {
            api.get('/api/auth/users/me/').then(r => setCurrentUserInfo(r.data));
        }
    }, [slug, user]);

    const fetchRoomData = async () => {
        try {
            const endpoint = user ? `/api/rooms/${slug}/` : `/api/rooms/${slug}/?guest_name=${guestNick}`;
            const res = await api.get(endpoint);
            setRoom(res.data);

            // Восстанавливаем состояние голосования
            const initialVotes = {};
            res.data.questions.forEach(q => {
                if (q.user_voted_choice) initialVotes[q.id] = q.user_voted_choice;
            });
            setVotedChoices(initialVotes);
        } catch (err) {
            if(err.response?.status === 403) alert("Доступ запрещен (возможно, вы забанены).");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (questionId, choiceId) => {
        if (!user && !guestNick) { alert("Сначала введите ник!"); return; }

        try {
            // ИСПРАВЛЕНИЕ: отправляем пустую строку "" вместо null
            await api.post('/api/votes/', {
                choice: choiceId,
                guest_nickname: user ? "" : guestNick
            });
            setVotedChoices(prev => ({ ...prev, [questionId]: choiceId }));
            fetchRoomData();
        } catch (err) {
            const errorData = err.response?.data;
            let msg = "Произошла ошибка при голосовании";
            if (errorData) {
                if (errorData.detail) msg = errorData.detail;
                else if (errorData.non_field_errors) msg = errorData.non_field_errors.join("\n");
                else if (errorData.guest_nickname) msg = `Никнейм: ${errorData.guest_nickname}`;
                else msg = JSON.stringify(errorData);
            }
            alert(msg);
            // Если ошибка "Уже голосовали" (400), обновляем данные
            if (err.response?.status === 400) fetchRoomData();
        }
    };

    const saveGuestNick = () => {
        if(!tempGuestNick.trim()) return;
        localStorage.setItem('guestNick', tempGuestNick);
        setGuestNick(tempGuestNick);
        fetchRoomData();
    };

    // --- Админские функции ---
    const addQuestion = async () => {
        if(!newQ.trim()) return;
        await api.post('/api/questions/', { room: room.id, text: newQ });
        setNewQ(""); fetchRoomData();
    };
    const addChoice = async (qId) => {
        if(!newC[qId]?.trim()) return;
        await api.post('/api/choices/', { question: qId, text: newC[qId] });
        setNewC({ ...newC, [qId]: "" }); fetchRoomData();
    };
    const toggleResults = async (q) => {
        await api.patch(`/api/questions/${q.id}/`, { show_results: !q.show_results });
        fetchRoomData();
    };
    const banUser = async () => {
        if(!banNick.trim()) return;
        if(!window.confirm(`Забанить ${banNick}?`)) return;
        try { await api.post(`/api/rooms/${slug}/ban_user/`, { nickname: banNick }); alert("Забанен"); setBanNick(""); }
        catch(e) { alert("Ошибка бана"); }
    };

    // Компонент отрисовки результатов
    const ResultsBlock = ({ question, isPrivateForAdmin }) => {
        const totalVotes = question.choices.reduce((sum, c) => sum + c.votes_count, 0);
        const maxVotes = Math.max(...question.choices.map(c => c.votes_count));

        const style = isPrivateForAdmin ? {
            border: '2px dashed #6366f1',
            background: '#eef2ff',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '15px'
        } : {};

        return (
            <div style={style}>
                {isPrivateForAdmin && (
                    <div style={{color: '#4f46e5', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9em'}}>
                        🔒 ВЫ ХОСТ (ВИДИТЕ ВСЁ)
                    </div>
                )}
                {question.choices.map(c => {
                    const percent = totalVotes === 0 ? 0 : Math.round((c.votes_count / totalVotes) * 100);
                    const isWinner = totalVotes > 0 && c.votes_count === maxVotes;
                    return (
                        <div key={c.id} className={`${styles.resultItem} ${isWinner ? styles.winner : ''}`}>
                            <div className={styles.resultHeader}>
                                <span>{c.text}</span>
                                <span>{percent}% ({c.votes_count})</span>
                            </div>
                            <div className={styles.resultTrack}>
                                <div className={styles.resultFill} style={{width: `${percent}%`}}></div>
                            </div>
                            {/* СПИСОК ИМЕН */}
                            {c.voters && c.voters.length > 0 && (
                                <div style={{fontSize: '0.85em', color: '#6b7280', marginTop: '5px'}}>
                                    👤 {c.voters.map(v => v.name).join(', ')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className={styles.roomContainer}><p>Загрузка...</p></div>;
    if (!room) return <div className={styles.roomContainer}><h3>Комната не найдена.</h3><Link to="/" className="global-btn btn-primary">На главную</Link></div>;

    const isCreator = currentUserInfo && (currentUserInfo.display_name === room.creator || currentUserInfo.email === room.creator);
    const canVote = user || guestNick;

    return (
        <div className={styles.roomContainer}>
            <Link to="/" className="global-btn btn-ghost" style={{marginBottom: '20px'}}>← На главную</Link>

            <div className={styles.roomHeader}>
                <h2 className={styles.roomTitle}>{room.title}</h2>
                <p className={styles.roomCreator}>Создатель: <strong>{room.creator}</strong></p>
            </div>

            {!user && !guestNick && (
                <div className={styles.questionCard} style={{textAlign: 'center', background: '#eef2ff'}}>
                    <h3>👋 Представьтесь</h3>
                    <div style={{display: 'flex', gap: '10px', maxWidth: '300px', margin: '15px auto'}}>
                        <input
                            value={tempGuestNick}
                            onChange={e => setTempGuestNick(e.target.value)}
                            placeholder="Ваш ник..."
                            className="global-input"
                        />
                        <button onClick={saveGuestNick} className="global-btn btn-primary">OK</button>
                    </div>
                </div>
            )}

            {isCreator && (
                <div className={styles.adminPanel}>
                    <h3 className={styles.adminTitle}>🔧 Управление</h3>
                    <div className={styles.adminFormGroup}>
                        <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Новый вопрос..." className="global-input" />
                        <button onClick={addQuestion} className="global-btn btn-primary">Добавить</button>
                    </div>
                     <div className={styles.adminFormGroup} style={{marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #f87171'}}>
                         <input value={banNick} onChange={e => setBanNick(e.target.value)} placeholder="Кого забанить?" className="global-input" />
                        <button onClick={banUser} className="global-btn btn-danger">Бан</button>
                    </div>
                </div>
            )}

            <div className={styles.questionsList}>
                {room.questions.map(q => {
                    const userVotedId = votedChoices[q.id];

                    return (
                        <div key={q.id} className={styles.questionCard}>
                            <h3 className={styles.questionText}>{q.text}</h3>

                            {/* 1. ЕСЛИ РЕЗУЛЬТАТЫ ОТКРЫТЫ ДЛЯ ВСЕХ */}
                            {q.show_results ? (
                                <ResultsBlock question={q} isPrivateForAdmin={false} />
                            ) : (
                                /* 2. ЕСЛИ ИДЕТ ГОЛОСОВАНИЕ */
                                <>
                                    <div className={styles.choicesGrid}>
                                        {q.choices.map(c => {
                                            const isSelected = userVotedId === c.id;
                                            return (
                                            <button
                                                key={c.id}
                                                onClick={() => handleVote(q.id, c.id)}
                                                disabled={!canVote || userVotedId}
                                                className={`${styles.choiceButton} ${isSelected ? styles.choiceSelected : ''}`}
                                            >
                                                {c.text}
                                                {isSelected && <span style={{float: 'right'}}>✅</span>}
                                            </button>
                                        )})}
                                    </div>

                                    {/* 3. ГЛАЗ БОГА ДЛЯ ХОСТА */}
                                    {isCreator && (
                                        <ResultsBlock question={q} isPrivateForAdmin={true} />
                                    )}
                                </>
                            )}

                            {isCreator && (
                                <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                                     <div className={styles.adminFormGroup} style={{marginBottom: '10px'}}>
                                        <input
                                            value={newC[q.id] || ""}
                                            onChange={e => setNewC({...newC, [q.id]: e.target.value})}
                                            placeholder="Вариант ответа..."
                                            className="global-input"
                                        />
                                        <button onClick={() => addChoice(q.id)} className="global-btn btn-primary">Add</button>
                                    </div>
                                    <button onClick={() => toggleResults(q)} className="global-btn btn-ghost" style={{width: '100%'}}>
                                        {q.show_results ? "🔒 Скрыть результаты" : "📊 Показать результаты всем"}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoomPage;