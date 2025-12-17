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
    }, [slug]);

    const getNoun = (number, one, two, five) => {
        let n = Math.abs(number) % 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
    };

    const handleVote = async (choiceId) => {
        // 1. Если это Гость (не авторизован)
        if (!user) {
            if (!guestName.trim()) {
                alert("Пожалуйста, представьтесь!");
                return;
            }
            // Гости голосуют сразу
            try {
                await api.post('/api/votes/', { choice: choiceId, guest_nickname: guestName });
                fetchRoom();
            } catch (error) {
                handleError(error);
            }
            return;
        }

        // 2. Если это Юзер — ДЕЛАЕМ ПРОВЕРКУ ПРЯМО СЕЙЧАС
        // Не верим старым данным, спрашиваем сервер: "Какое у меня сейчас имя?"
        try {
            const profileRes = await api.get('/api/auth/users/me/');
            const freshProfile = profileRes.data;

            if (!freshProfile.display_name) {
                // Если даже на сервере имени нет — тогда отправляем в профиль
                if (window.confirm("Чтобы голосовать, нужно заполнить имя. Перейти в профиль?")) {
                    navigate('/profile');
                }
                return;
            }

            // Если имя есть — голосуем!
            await api.post('/api/votes/', { choice: choiceId });
            fetchRoom(); // Обновляем цифры

        } catch (error) {
            handleError(error);
        }
    };

    // Функция для красивого вывода ошибок
    const handleError = (error) => {
        if (error.response?.data?.non_field_errors) {
            alert(error.response.data.non_field_errors[0]);
        } else if (error.response?.data?.detail) {
            alert(error.response.data.detail);
        } else {
            alert("Ошибка при голосовании");
        }
    };

    if (!room) return <div style={{padding: 20}}>Загрузка...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>← К списку</Link>
            <h1>{room.title}</h1>
            <p style={{ color: '#7f8c8d' }}>{room.description}</p>

            {!user && (
                <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <strong>👋 Вы как Гость:</strong><br />
                    <input
                        type="text"
                        placeholder="Ваше имя..."
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        style={{ marginTop: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
            )}

            {room.questions.map(q => (
                <div key={q.id} style={{ marginBottom: '25px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0 }}>❓ {q.text}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {q.choices.map(choice => (
                            <div key={choice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px 15px', borderRadius: '5px' }}>
                                <span>{choice.text}</span>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {choice.votes_count} {getNoun(choice.votes_count, 'голос', 'голоса', 'голосов')}
                                    </span>
                                    <button onClick={() => handleVote(choice.id)} style={{ padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                        ✔ Выбрать
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RoomPage;